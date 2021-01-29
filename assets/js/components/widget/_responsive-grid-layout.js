import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {DoughnutPieChart} from "../index";
import {Responsive, WidthProvider} from "react-grid-layout/index";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import '../../../styles/component/_responsive-grid-layout.scss';
import {WIDGET_TYPE} from "../../utils";
import {CounterSum} from "./_counter-sum";
import {WidgetTable} from "./_widget-table";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class ResponsiveGridLayout extends Component {
    constructor(props) {
        super(props);

        this.state = {
            compactType: "horizontal",
            mounted: false,
        };
    }

    componentDidMount() {
        this.setState({ mounted: true });
    }

    render() {
        const { data } = this.props;
        console.log('data', data);
        const { mounted, compactType } = this.state;
        // min Width :x 356;
        // row Height : 340 / 2;

        const layout = data && data.length > 0 ? data.map(item => item.layout) : [];
        return (
            <div className="responsive-grid-layout">
                { data && data.length > 0  ? <ResponsiveReactGridLayout
                    {...this.props}
                    rowHeight={155}
                    cols={{lg: 12, md: 9, sm: 6, xs: 3, xxs: 3}}
                    layout={layout}
                    onLayoutChange={(e) => {
                        console.log("1", e);
                    }}
                    // onDrop={onDrop}
                    // WidthProvider option
                    measureBeforeMount={false}
                    // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
                    // and set `measureBeforeMount={true}`.
                    useCSSTransforms={mounted}
                    compactType={compactType}
                    preventCollision={!compactType}
                    isDroppable={true}
                    droppingItem={{i: "xx", h: 50, w: 250 }}
                >
                    {data.map((item) => {

                        let WidgetLayout = ({layout, dataWidget, widgetHeader, widgetType}) => {
                            let component;
                            switch (widgetType) {
                                case WIDGET_TYPE.doughnut:
                                case WIDGET_TYPE.pie: {
                                    component = <DoughnutPieChart
                                        id={layout.i}
                                        widgetHeader={widgetHeader}
                                        type={widgetType}
                                        data={dataWidget}
                                        height='250'
                                        minHeight='250'
                                    />;
                                    break;
                                }
                                case WIDGET_TYPE.counterSum: {
                                    component = <CounterSum
                                        data={dataWidget}
                                        widgetHeader={widgetHeader}
                                    />
                                    break;
                                }
                                case WIDGET_TYPE.table: {
                                    component = <WidgetTable
                                        data={dataWidget}
                                        widgetHeader={widgetHeader}
                                        isDashboardComponent={true}
                                    />
                                }
                            }
                            return component;
                        }

                        return (
                            <div key={item.layout.i} data-grid={item.layout} className="widget card">
                                <WidgetLayout {...item}/>
                            </div>
                        )
                    })}
                </ResponsiveReactGridLayout> : <p className="text-center"> No widget exist </p>}
            </div>
        );
    }
}

ResponsiveGridLayout.propTypes = {
    data: PropTypes.array
};