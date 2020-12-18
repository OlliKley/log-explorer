import React, {Component} from 'react';
import {LogTableActions, Live} from '../actions';
import PropTypes from 'prop-types';
import StatusWidget from './widget/_status';
import DeviceWidget from './widget/_device-type';
import {WidgetTable} from './widget/_widget-table';

export class Summary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            widgets: []
        };
    }

    async loadData() {
        const {data = [], error = 0} = await LogTableActions.getSummary();
        if (error) {
            return;
        }

        this.setState({
            widgets: data
        });
    }

    componentDidMount() {
        this.loadData();
        const _this = this;
        Live.onRefresh(() => {
            _this.loadData();
        });
    }

    render() {
        const {widgets} = this.state;
        const items = widgets.map((item, key) => {
            const {title, data, name} = item;

            let layout = <span className="d-flex justify-content-center p-3">No data</span>;

            if (data && data.length > 0) {
                const sortData = data.sort((a, b) => (a.value > b.value) ? -1 : 1);

                switch (name) {
                    case 'status':
                        layout = <StatusWidget data={sortData}/>;
                        break;
                    case 'device_type':
                        layout = <DeviceWidget data={sortData}/>;
                        break;
                    default:
                        layout = <WidgetTable data={sortData}/>;
                        break;
                }
            }

            return (
                <div key={key} className="col-12 col-md-4">
                    <div className="card">
                        <div className="card-header">
                            {title}
                        </div>
                        <div className="card-body p-0">
                            {layout}
                        </div>
                    </div>
                </div>
            );
        });

        return <>{items}</>;
    }
}

Summary.propTypes = {
    className: PropTypes.string
};
