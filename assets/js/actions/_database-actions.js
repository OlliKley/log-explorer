import {request} from '..';

const DatabaseActions = {
    syncAll() {
        return request('/database/sync', {method: 'POST'});
    },
    getAllTable() {
        return request('/database/tables', {method: 'GET'});
    },
    getTableColumns(table) {
        return request('/database/' + table + '/columns', {method: 'GET'});
    },
    createOrUpdate(tableId, table, columns) {
        if (tableId) {
            return request('/database/' + tableId, {method: 'PUT', body: JSON.stringify({
                name: table,
                columns
            })});
        }

        return request('/database/create', {
            method: 'POST', body: JSON.stringify({
                name: table,
                columns
            })
        });
    }
};

export default DatabaseActions;
