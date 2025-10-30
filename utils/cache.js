import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { pino } from 'pino'

const logger = pino({
    level: 'trace',
    transport: { target: 'pino-pretty' }
})

const bento = new BentoCache({
    default: 'cache',
    logger,
    stores: {
        cache: bentostore()
            .useL1Layer(memoryDriver({ maxSize: '10mb' })),
    }
})
export default bento
