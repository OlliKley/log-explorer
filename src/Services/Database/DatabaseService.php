<?php


namespace App\Services\Database;


use App\Entity\Table;
use App\Exceptions\ActionDeniedException;
use App\Exceptions\TableExistException;
use App\Services\Clickhouse\ClickhouseServiceInterface;
use App\Services\Clickhouse\ConnectionInterface;
use App\Services\Column\ColumnServiceInterface;
use App\Services\Graph\GraphServiceInterface;
use App\Services\GraphLine\GraphLineServiceInterface;
use App\Services\LogView\LogViewServiceInterface;
use App\Services\Table\TableServiceInterface;
use App\ServicesLogViewColumn\LogViewColumnServiceInterface;
use Doctrine\ORM\EntityManagerInterface;

class DatabaseService implements DatabaseServiceInterface
{
    /** @var EntityManagerInterface */
    private $em;
    /** @var ConnectionInterface */
    private $connection;
    /** @var TableServiceInterface */
    private $tableService;
    /** @var ColumnServiceInterface */
    private $columnService;
    /** @var ClickhouseServiceInterface */
    private $clickhouseService;
    /**
     * @var LogViewServiceInterface
     */
    private $logViewService;
    /** @var GraphServiceInterface */
    private $graphService;
    /** @var GraphLineServiceInterface */
    private $graphLineService;
    /** @var LogViewColumnServiceInterface */
    private $logViewColumnService;

    /**
     * DatabaseService constructor.
     * @param EntityManagerInterface $em
     * @param ConnectionInterface $connection
     * @param TableServiceInterface $tableService
     * @param ColumnServiceInterface $columnService
     * @param ClickhouseServiceInterface $clickhouseService
     * @param LogViewServiceInterface $logViewService
     * @param GraphServiceInterface $graphService
     * @param GraphLineServiceInterface $graphLineService
     * @param LogViewColumnServiceInterface $logViewColumnService
     */
    public function __construct(
        EntityManagerInterface $em,
        ConnectionInterface $connection,
        TableServiceInterface $tableService,
        ColumnServiceInterface $columnService,
        ClickhouseServiceInterface $clickhouseService,
        LogViewServiceInterface $logViewService,
        GraphServiceInterface $graphService,
        GraphLineServiceInterface $graphLineService,
        LogViewColumnServiceInterface $logViewColumnService
    ) {
        $this->em = $em;
        $this->connection = $connection;
        $this->tableService = $tableService;
        $this->columnService = $columnService;
        $this->clickhouseService = $clickhouseService;
        $this->logViewService = $logViewService;
        $this->graphService = $graphService;
        $this->graphLineService = $graphLineService;
        $this->logViewColumnService = $logViewColumnService;
    }

    private function checkIfHasTimestamp(array $columns): bool
    {
        foreach ($columns as $column) {
            if ($column['name'] === 'timestamp' && $column['type'] === 'DateTime') {
                return true;
            }
        }
        return false;
    }

    private function syncTable(string $tableName): ?Table
    {
        $clickhouseColumns = $this->connection->getRawColumns($tableName);

        if (!$this->checkIfHasTimestamp($clickhouseColumns)) {
            return null;
        }

        $table = $this->tableService->getTableByName($tableName);
        $isExist = true;
        if (is_null($table)) {
            $table = $this->tableService->createTable($tableName, false);
            $this->setupNewTable($table);
            $isExist = false;
        }

        $oldColumns = $table->getColumns()->toArray();
        $oldColumnIndexed = [];
        foreach ($oldColumns as $column) {
            $oldColumnIndexed[$column->getName()] = $column;
        }
        unset($oldColumns);
        foreach ($clickhouseColumns as $clickhouseColumn) {
            $column = null;
            $name = $clickhouseColumn['name'];
            $type = $clickhouseColumn['type'];
            $title = ucfirst($name);
            $title = str_replace('_', ' ', $title);
            unset($oldColumnIndexed[$name]);
            if ($isExist) {
                $column = $this->columnService->findByName($table, $name);
                if (!empty($column) && ($column->getType() !== $type || $column->getTitle() !== $title)) {
                    $this->columnService->updateColumn($column, ['title' => $title, 'type' => $type], false);
                }
            }
            if (empty($column)) {
                $column = $this->columnService->create(
                    $table, [
                    'name' => $name,
                    'title' => $title,
                    'type' => $type
                ],
                    false
                );
                $this->logViewService->addColumnSetting($table->getLogView(), $column, false);
            }
        }
        if ($oldColumnIndexed) {
            foreach ($oldColumnIndexed as $column) {
                $this->logViewColumnService->remove($table->getLogView(), $column);
                $this->columnService->remove($column);
            }
        }
        $this->em->flush();

        return $table;
    }

    /**
     * @inheritDoc
     */
    public function syncAllTableToSystem()
    {
        $tables = $this->connection->getTables();
        foreach ($tables as $table) {
            $this->syncTable($table);
        }
        $notExistTables = $this->tableService->getTableNotIn($tables);
        foreach ($notExistTables as $table) {
            $this->deleteTable($table);
        }
    }

    private function deleteTable(Table $table)
    {
        foreach ($table->getColumns() as $column) {
            $this->columnService->remove($column, false);
            $table->removeColumn($column);
        }
        $this->em->remove($table);
        $this->em->flush();
    }

    /**
     * @inheritDoc
     */
    public function createTable(string $name, array $columns, array $options = []): ?Table
    {
        if ($this->connection->tableExists($name)) {
            throw new TableExistException();
        }
        if ($this->tableService->isTableExist($name)) {
            throw new TableExistException();
        }
        $hasTimestamp = false;
        foreach ($columns as $k => $column) {
            if ($column['name'] === 'timestamp') {
                if ($column['type'] !== 'DateTime') {
                    $columns[$k]['type'] = 'DateTime';
                }
                $hasTimestamp = true;
                break;
            }
        }
        if (!$hasTimestamp) {
            $columns[] = [
                'name' => 'timestamp',
                'type' => 'DateTime',
                'title' => 'Created at',
            ];
        }
        $query = $this->makeCreateTableQuery($name, $columns, $options);

        if (!$this->connection->exec($query)) {
            return null;
        }

        $columns = $this->makeColumnTitle($columns);

        $table = $this->tableService->createTable($name, false);
        foreach ($columns as $column) {
            $this->columnService->create($table, $column, false);
        }
        $this->setupNewTable($table);
        $this->em->flush();

        return $table;
    }

    private function setupNewTable(Table $table)
    {
        $graph = $this->graphService->createLogViewGraph($table, 12, false);
        $this->graphLineService->createDefaultGraphLine($graph, false);
        $logView = $this->logViewService->createLogView($table, $graph, null, false);
        $this->logViewService->setupColumnSetting($logView, false);
    }

    private function makeCreateTableQuery(string $name, array $columns, array $options = []): string
    {
        $query = 'CREATE TABLE ' . $name . ' (';
        foreach ($columns as $k => $column) {
            if (!empty($k)) {
                $query .= ',';
            }
            $query .= "`{$column['name']}` {$column['type']}";
        }
        $query .= ") ENGINE = MergeTree
PARTITION BY (toYYYYMM(timestamp))
ORDER BY timestamp\n";
        if (!empty($options['ttl'])) {
            $query .= 'TTL '.$options['ttl']."\n";
        }
        $query .= 'SETTINGS index_granularity = 8192';

        return $query;
    }

    private function makeAlertTableQuery(string $tableName, array $column): string
    {
        return "ALTER TABLE {$tableName} ADD COLUMN `{$column['name']}` {$column['type']}";
    }

    private function makeColumnTitle(array $columns): array
    {
        foreach ($columns as $k => $column) {
            if (empty($column['title'])) {
                $title = $column['name'];
                $title = ucfirst($title);
                $title = trim(str_replace('_', ' ', $title));
                $columns[$k]['title'] = $title;
            }
        }
        return $columns;
    }

    /**
     * @inheritDoc
     */
    public function updateTable(Table $table, string $name, array $columns): Table
    {
        if ($table->getName() !== $name) {
            // not allow to change table name
            throw new ActionDeniedException();
        }
        foreach ($columns as $column) {
            if (!empty($column['id'])) {
                $obj = $this->columnService->findById($column['id']);
                if (empty($obj) || $obj->getTable()->getId() != $table->getId() || $obj->getName() !== $column['name'] || $obj->getType() !== $column['type']) {
                    // not allow to change column name or type
                    throw new ActionDeniedException();
                }
                if ($column['title'] !== $obj->getTitle()) {
                    $this->columnService->updateColumn($obj, $column);
                }
            } else {
                $query = $this->makeAlertTableQuery($name, $column);
                $this->connection->exec($query);
                $this->columnService->create($table, $column);
            }
        }
        return $table;
    }

    /**
     * @inheritDoc
     */
    public function dropTableIfExist(string $name)
    {
        $this->connection->dropTableIfExist($name);
        if ($this->tableService->isTableExist($name)) {
            $table = $this->tableService->getTableByName($name);
            $this->deleteTable($table);
        }
    }
}
