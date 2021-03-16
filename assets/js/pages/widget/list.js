import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Alert, WidgetActions} from "../../actions";
import {Button, CardHeader, Icon, Link, Table, ResponsiveGridLayout} from "../../components";
import {WIDGET_TYPE} from "../../utils";

class WidgetList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            widgets: []
        };
    }

    componentDidMount() {
        const that = this;
        WidgetActions.listWidget()
            .then(res => {
                const {error, data} = res;
                if (error) {
                    return;
                }

                that.setState({
                    widgets: data
                });
            });
    }

    deleteWidget(key) {
        const {widgets} = this.state;
        const that = this;
        WidgetActions.deleteWidget(widgets[key].id)
            .then(res => {
                const {error} = res;
                if (error) {
                    return;
                }

                widgets.splice(key, 1);
                that.setState({widgets});
                Alert.success('Delete successful');
            });
    }

    render() {
        const {widgets} = this.state;

        return (
            <div className="database">
                <div className="card">
                    <CardHeader title="Widget list" showCollapseButton={false} showRemoveButton={false}>
                        <Link href={'/widget/create'} className={'btn btn-success'}>Create widget</Link>
                    </CardHeader>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-12">
                                <Table>
                                    <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Query</th>
                                        <th>Last update</th>
                                        <th>&nbsp;</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {widgets.map((item, key) => {
                                        const url = '/widget/' + item.id;
                                        return <tr key={key}>
                                            <td>{item.title}</td>
                                            <td>{item.type}</td>
                                            <td>{item.query}</td>
                                            <td>{item.last_updated}</td>
                                            <td>
                                                <Link href={url} className={'btn btn-success mr-3'}><Icon name={'edit'}/></Link>
                                                <Button onClick={e => this.deleteWidget(key)} color={'danger'}><Icon name={'trash'}/></Button>
                                            </td>
                                        </tr>;
                                    })}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<WidgetList/>, document.querySelector('#root'));
