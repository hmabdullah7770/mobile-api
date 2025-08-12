import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import setupSwagger from "./swagger.js";
import errorHandler from './middlewares/errorHandler.middleware.js';


const app = express()

app.use(cors(
    {
        origin: process.env.CORS_URL


    }
))



app.use(express.json({ limit: '10kb' }))

app.use(express.urlencoded({ limit: '10kb', extended: true }))

app.use(express.static('public'))

app.use(cookieParser())


setupSwagger(app);


//routes import
import userRouter from './routes/user.routes.js'
import cardRouter from "./routes/card.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
// import ratingRouter from "./routes/rating.routes.js"
import ratingRoutes from "./routes/rating.routes.js";
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
import followlistRouter from "./routes/followlist.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import styleRouter from "./routes/style.routes.js"
import categouryRouter from "./routes/categoury.routes.js"

import bannerRoutes  from "./routes/banner.routes.js"
import postRouter  from './routes/post.routes.js'
import newcommentsRouter from "./routes/newcomment.routes.js"
// import likeRouter from "./routes/like.routes.js"
// import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"


//routes
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use('/api/v1/users', userRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/followlist", followlistRouter)
app.use("/api/v1/cards", cardRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/ratings", ratingRoutes)
app.use("/api/v1/styles", styleRouter)
app.use("/api/v1/categouries", categouryRouter)
app.use("/api/v1/banner", bannerRoutes); 
app.use("/api/v1/post", postRouter)
app.use("/api/v1/newcomments", newcommentsRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)











//create store routes

import storeRoutes from './routes/store/store.createstore.routes.js';
import storebannerRoutes from './routes/store/store.banner.routes.js';
import productRoutes from './routes/store/store.product.routes.js';
import threeDVideoRoutes from './routes/store/store.3dvideo.routes.js';
import carouselRoutes from './routes/store/store.carousel.routes.js'
import orderRoutes from './routes/store/store.order.routes.js'

app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/stores', storebannerRoutes);
app.use('/api/v1/stores', productRoutes);
app.use('/api/v1/stores', threeDVideoRoutes);
app.use('/api/v1/stores', carouselRoutes)
app.use('/api/v1/stores',orderRoutes)


//middleware to convert all the error to json format
app.use(errorHandler);
export default app
