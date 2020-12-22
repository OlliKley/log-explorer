<?php


namespace App\Controller\Api;


use App\Entity\Table;
use App\Exceptions\ActionDeniedException;
use App\Exceptions\TableExistException;
use App\Form\TableType;
use App\Services\Database\DatabaseServiceInterface;
use App\Services\Table\TableServiceInterface;
use Doctrine\DBAL\Exception;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\Annotation\Route;

class DatabaseController extends ApiController
{
    /**
     * @Route("/api/table", methods = "GET")
     * @param TableServiceInterface $tableService
     * @return JsonResponse
     */
    public function tables(TableServiceInterface $tableService): JsonResponse
    {
        $data = $tableService->getAllTable();
        return $this->responseSuccess(['data' => $data]);
    }

    /**
     * @Route("/api/table/{name}/columns", methods = "GET")
     * @param Table $table
     * @param Request $request
     * @return JsonResponse
     */
    public function columns(Table $table, Request $request): JsonResponse
    {
        $chunk = $request->get('chunk', 0);
        $columns = $table->getColumns()->toArray();

        if (!empty($chunk) && is_numeric($chunk)) {
            $columns = array_chunk($columns, $chunk);
        }

        return $this->responseSuccess([
            'table' => $table->getName(),
            'data' => $columns
        ]);
    }

    /**
     * @Route("/api/table/sync", methods = "POST")
     * @param DatabaseServiceInterface $databaseService
     * @return JsonResponse
     */
    public function syncAll(DatabaseServiceInterface $databaseService): JsonResponse
    {
        $databaseService->syncAllTableToSystem();

        return $this->responseSuccess();
    }

    /**
     * @Route("/api/table/create", methods = "POST")
     * @param Request $request
     * @param DatabaseServiceInterface $databaseService
     * @param UrlGeneratorInterface $urlGenerator
     * @return JsonResponse
     */
    public function createTable(
        Request $request,
        DatabaseServiceInterface $databaseService,
        UrlGeneratorInterface $urlGenerator
    ): JsonResponse {
        $data = $request->request->all();
        $form = $this->createForm(TableType::class);
        $form->submit($data);

        if ($form->isSubmitted() && $form->isValid()) {
            try {
                $options = [
                    'ttl' => $form->get('ttl')->getData()
                ];
                $table = $databaseService->createTable($form->get('name')->getData(), $form->get('columns')->getData(), $options);
            } catch (TableExistException $e) {
                return $this->responseError([
                    'message' => 'Table already exist'
                ]);
            } catch (Exception $e) {
                return $this->responseError([
                    'message' => 'Can not create table, please check if any table or column value is invalid'
                ]);
            }

            return $this->responseSuccess([
                'redirect' => $urlGenerator->generate('database_update', ['name' => $table->getName()])
            ]);
        }
        return $this->responseFormError($form);
    }

    /**
     * @Route("/api/table/{name}", methods = "PUT")
     * @param Table $table
     * @param Request $request
     * @param DatabaseServiceInterface $databaseService
     * @return JsonResponse
     */
    public function updateTable(
        Table $table,
        Request $request,
        DatabaseServiceInterface $databaseService
    ): JsonResponse {
        $data = $request->request->all();
        $form = $this->createForm(TableType::class);
        $form->submit($data);

        if ($form->isSubmitted() && $form->isValid()) {
            try {
                $databaseService->updateTable($table, $form->get('name')->getData(), $form->get('columns')->getData());
            } catch (TableExistException $e) {
                return $this->responseError([
                    'message' => 'Table already exist'
                ]);
            } catch (Exception $e) {
                return $this->responseError([
                    'message' => 'Can not create table, please check if any table or column value is invalid'
                ]);
            } catch (ActionDeniedException $e) {
                return $this->responseError([
                    'message' => 'Can not create table'
                ]);
            }
            return $this->responseSuccess();
        }
        return $this->responseError([
            'message' => 'Can not create table'
        ]);
    }
}
