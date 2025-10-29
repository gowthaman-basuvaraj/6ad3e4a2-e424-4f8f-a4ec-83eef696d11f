const {createApp} = Vue
const colors = ['#5470c6', '#91cc75']
const app = createApp({
    components: {VueDatePicker},
    data() {
        return {
            data: [],
            search: {
                from: dayjs("2023-03-13 00:00:00").toDate(),
                to: dayjs("2024-03-13 23:59:59").toDate(),
            },
            format: "yyyy-MM-dd HH:mm:ss",
            search_result: {
                carbon_saved: 0,
                fueld_saved: 0,
            },
            total: {
                carbon_saved: 0,
                fueld_saved: 0,
            },
            monthly: {
                carbon_saved: 0,
                fueld_saved: 0,
            },
            preset: [
                {text: 'Last 30 days', value: -30},
                {text: 'Last 60 days', value: -60},
                {text: 'Last Year', value: 'PREV_YEAR'},
            ],
            option: {
                yAxis: [
                    {
                        type: 'value',
                        name: 'Carbon Savings',
                        position: 'left',
                        alignTicks: true,
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: colors[0]
                            }
                        },
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        type: 'value',
                        name: 'Diesel Savings',
                        position: 'right',
                        alignTicks: true,
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: colors[1]
                            }
                        },
                        axisLabel: {
                            formatter: '{value} k'
                        }
                    },
                ],

                legend: {
                    data: ['Carbon Savings', 'Diesel Savings']
                },
                xAxis: [
                    {
                        axisTick: {
                            alignWithLabel: true
                        },
                        // prettier-ignore
                        data: []
                    }
                ],
                series: [
                    {
                        name: 'Carbon Savings',
                        type: 'bar',
                        data: [],
                    },
                    {
                        name: 'Diesel Savings',
                        type: 'bar',
                        yAxisIndex: 1,
                        data: [],
                    },
                ],
            },
        }
    },
    watch: {
        'search.to': function (newVal, oldVal) {
            console.log('to', newVal, oldVal)
            if(dayjs(newVal).isAfter(dayjs(this.search.from))){
                this.search_dates()
            }
        },
        'search.from': function (newVal, oldVal) {
            console.log('from', newVal, oldVal)
            if(dayjs(newVal).isBefore(dayjs(this.search.to))){
                this.search_dates()
            }
        }
    },
    methods: {
        presetDays(what) {
            if (what === 'PREV_YEAR') {
                this.search.from = dayjs().startOf('year').subtract(1, 'year').toDate()
                this.search.to = dayjs().startOf('year').toDate()
            } else {
                this.search.from = dayjs().subtract(what, 'days').toDate()
                this.search.to = dayjs().toDate()
            }
        },
        search_dates() {
            fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: dayjs(this.search.from).format("YYYY-MM-DD HH:mm:ss"),
                    to: dayjs(this.search.to).format("YYYY-MM-DD HH:mm:ss"),
                })
            }).then(response => {
                response.json().then(data => {
                    this.search_result = data
                })
            })
        },
        load_dashboard() {
            fetch('/api/dashboard')
                .then(response => response.json())
                .then(data => {
                    this.data = data
                    console.log(data)
                    this.total.carbon_saved = data.map(item => item.carbon_saved)
                        .reduce((a, b) => a + b, 0)
                    this.total.fueld_saved = data.map(item => item.fueld_saved)
                        .reduce((a, b) => a + b, 0)

                    this.monthly.carbon_saved = this.total.carbon_saved / data.length
                    this.monthly.fueld_saved = this.total.fueld_saved / data.length

                    this.option.xAxis[0].data = data.map(item => dayjs(item.month).format("MMM YYYY"))
                    this.option.series[0].data = data.map(item => item.carbon_saved / 1000)
                    this.option.series[1].data = data.map(item => item.fueld_saved / 1000)

                })
        }
    },
    mounted() {
        this.load_dashboard()
        this.search_dates()
    }
})
app.config.globalProperties.$filters = {
    numbered(value) {
        return new Intl.NumberFormat('en-US', {maximumFractionDigits: 1}).format(value)
    }
}
app.component('v-chart', VueECharts)
app.component("VueDatePicker", VueDatePicker)
app.mount('#app')