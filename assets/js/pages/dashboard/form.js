import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {Button, ResponsiveGridLayout, Select2, FormField, Icon} from '../../components/';
import '../../../styles/component/_dashboard-form.scss';
import {WIDGET_TYPE} from "../../utils";
import {isEqual} from "lodash";
import {DashboardActions, WidgetActions} from "../../actions";

class DashboardPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            widgetSelected: [],
            dashboardDetail: {},
            initialData: {},
            errors: {},
            widgets: [],
            isLoading: false,
        }

        this.onChangeData = this.onChangeData.bind(this);
        this.onSubmitForm = this.onSubmitForm.bind(this);
    }


    onChangeData({name, value}) {
        if (name) {
            this.setState((preState) => ({
                dashboardDetail: {
                    ...preState.dashboardDetail,
                    [name]: value,
                }
            }))

            if (name === 'title') {
                if (!value) {
                    this.setState({
                        errors: {
                            title: true,
                        }
                    });
                    return;
                } else {
                    this.setState({
                        errors: {},
                    })
                }
            }
        }
    }

    async componentDidMount() {
        // call dashboardDetail detail API here

        this.setState({
            isLoading: true,
        })

        const {dashboard} = this.props;

        const [
            dashboardRes,
            widgetListRes
        ] = await Promise.all([
            dashboard && DashboardActions.loadDashboard(dashboard),
            WidgetActions.listWidget(),
        ]);

        const dashboardDetail = dashboardRes && !dashboardRes.error && dashboardRes.data ? dashboardRes.data : {};
        const widgets = widgetListRes && widgetListRes.data && widgetListRes.data.length > 0 ? widgetListRes.data : [];

        this.setState({
            dashboardDetail,
            initialData: {...dashboardDetail},
            widgets,
            isLoading: false,
        });
    }

    async onSubmitForm() {
        const {dashboardDetail, widgetSelected} = this.state;
        const {id, title} = dashboardDetail;

        if (!title) {
            this.setState({
                errors: {
                    title: true,
                }
            });
            return;
        } else {
            this.setState({
                errors: {},
            })
        }
        ;

        const response = await DashboardActions.createOrUpdate(id, {
            title,
            dashboardWidgets: [...widgetSelected].map(item => item.id),
        });

        if (response && !response.error && response.redirect) {
            window.location.href = response.redirect;
            return;
        } else {
            // error will be handle here
        }

    }

    render() {
        const {
            widgetSelected,
            dashboardDetail,
            initialData,
            errors,
            widgets,
            isLoading
        } = this.state;

        // const widgets = [
        //     {
        //         layout: {i: "a", x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2, static: true},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         title: 'Devices and Machine',
        //         widgetType: WIDGET_TYPE.doughnut
        //     }, {
        //         layout: {i: "b", x: 3, y: 0, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 1',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "c", x: 6, y: 0, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 2',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "d", x: 0, y: 2, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 3',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "e", x: 3, y: 2, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 4',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "h", x: 6, y: 2, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 5',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "i", x: 0, y: 4, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 6',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }, {
        //         layout: {i: "j", x: 3, y: 4, w: 3, h: 1, minW: 3, minH: 1},
        //         dataWidget: [
        //             {label: 'Mobile', value: 872966},
        //         ],
        //         widgetHeader: 'Devices 7',
        //         widgetType: WIDGET_TYPE.counterSum,
        //     }, {
        //         layout: {i: "k", x: 6, y: 4, w: 3, h: 1, minW: 3, minH: 1},
        //         dataWidget: [
        //             {label: 'Des', value: 392423482},
        //         ],
        //         widgetHeader: 'Devices 8',
        //         widgetType: WIDGET_TYPE.counterSum,
        //     }, {
        //         layout: {i: "l", x: 0, y: 6, w: 3, h: 3, minW: 3, minH: 3},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices and Machine 9',
        //         widgetType: WIDGET_TYPE.table,
        //     }, {
        //         layout: {i: "m", x: 0, y: 0, w: 3, h: 1, minW: 3, minH: 1},
        //         dataWidget: [
        //             {label: 'Des', value: 392423482},
        //         ],
        //         widgetHeader: 'Devices 10',
        //         widgetType: WIDGET_TYPE.counterSum,
        //     }, {
        //         layout: {i: "n", x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2},
        //         dataWidget: [
        //             {label: 'Mobile', value: 2000},
        //             {label: 'Desktop', value: 700},
        //             {label: 'Bot', value: 350},
        //             {label: 'Botm', value: 34},
        //         ],
        //         widgetHeader: 'Devices 11',
        //         widgetType: WIDGET_TYPE.doughnut,
        //     }
        // ]

        const _columns = [...widgets].map((item, key) => {
            return <option key={key} value={item.title}>{item.title}</option>;
        });

        const {title = '', description = ''} = dashboardDetail;

        return (
            <div className="dashboard-management">
                {isLoading ? (<span
                    className="spinner-border spinner-border-sm mr-2"
                    role="status" aria-hidden="true"></span>) : (<div className="card mr-2 ml-2">
                    <div className="card-header">
                        <span className="align-items-center d-inline-flex">
                            <h3 className="mb-0">{`${title || 'Create new dashboard'}`}</h3>
                            {initialData.title &&
                            <a href="#"
                               data-toggle="collapse"
                               data-target="#collapseEditableDashboard"
                               aria-expanded="false"
                               aria-controls="collapseEditableDashboard"
                            >
                                <Icon name='pencil-alt' className="pl-2 pt-1"/>
                            </a>}
                        </span>
                    </div>
                    <div className="card-body">
                        <div
                            className={`dashboard-information collapse ${!initialData.title && 'show'}`}
                            id="collapseEditableDashboard">
                            <FormField
                                label='Title'
                                placeholder='Dashboard title'
                                fieldName='title'
                                value={title}
                                onChange={(e) => this.onChangeData(e.target)}
                                isMandatory={true}
                                errors={errors}
                            />
                            <FormField
                                label='Description'
                                placeholder='Dashboard description'
                                fieldName='description'
                                value={description}
                                onChange={(e) => this.onChangeData(e.target)}
                            />
                            <div className="d-inline-flex">
                                <Button className="btn-search mb-3"
                                        disabled={isEqual(initialData, dashboardDetail) || Object.keys(errors).length > 0}
                                        onClick={() => this.onSubmitForm()}
                                >
                                    Save
                                </Button>
                                {initialData.title &&
                                <Button className="btn-search mb-3 ml-2"
                                        data-toggle="collapse"
                                        data-target="#collapseEditableDashboard"
                                        aria-expanded="false"
                                        aria-controls="collapseEditableDashboard"
                                        color="default"
                                >
                                    Cancel
                                </Button>}
                            </div>
                        </div>
                        <div className="widget form-group">
                            <label>Widgets</label>
                            <Select2
                                id={'widget-selected'}
                                multiple="multiple"
                                data-placeholder="Select widget"
                                value={widgetSelected && widgetSelected.length > 0 ? widgetSelected.map(item => item.title) : []}
                                onChange={(e) => {
                                    const summary = $('#widget-selected').val();
                                    const newWidgetList = summary.reduce((obj, item) => {
                                        const newWidget = [...this.state.widgets].filter(el => el.title === item);
                                        if (newWidget) {
                                            const {} = newWidget[0];
                                            obj.push({
                                                ...newWidget[0],
                                            });
                                        }
                                        return obj;
                                    }, []);

                                    this.setState({
                                        widgetSelected: [...newWidgetList],
                                    })
                                }}
                            >
                                {_columns}
                            </Select2>
                        </div>
                    </div>
                </div>)}
                {/*<ResponsiveGridLayout data={widgetSelected}/>*/}
            </div>
        );
    }
}

const root = document.querySelector('#root');
ReactDOM.render(<DashboardPage {...root.dataset}/>, root);
