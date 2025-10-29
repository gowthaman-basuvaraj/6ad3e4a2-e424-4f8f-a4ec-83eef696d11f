import {createApp} from 'vue'

const app = createApp({
    data() {
        return {
            count: 0,
            message: "Hello Vue",
            data: []
        }
    },
    methods: {
        increment() {
            this.count++
        }
    },
    mounted() {
        console.log(`The initial count is ${this.count}.`)
        fetch('/api/dashboard')
            .then(response => response.json())
            .then(data => {
                this.data = data
                console.log(data)
            })
    }
})

app.mount('#app')