import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErrors.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Order from "../../models/store/store.order.model.js";
import CreateStore from "../../models/store/store.createstore.model.js";
import {User} from "../../models/user.model.js";
import mongoose from "mongoose";
import Product from '../../models/store/store.product.model.js'


//create a new order with request body

// export const createOrderreq = asyncHandler(async (req, res) => {
//     const {
//         storeId,
//         items,
//         // customerName,
//         // customerEmail,
//         customerPhone,
//         customerAddress,
//         paymentMethod,
//         notes
//     } = req.body;

//     // Validate required fields
//     if (!storeId || !items  || !customerPhone || !customerAddress) {
//         throw new ApiError(400, "All required fields must be provided");
//     }

   
//     // Get store details
//     const store = await CreateStore.findById(storeId);
//     if (!store) {
//         throw new ApiError(404, "Store not found");
//     }


//     // const itemexit  = await Product.findById({items[0].productId,storeId:storeId})
    
//     // if(!itemexit){
//     //     throw new ApiError(404, "Product not found")
//     // }
    
//     // item = itemexist.productName
//     // item = itemexist.productImages[0]
//     // item = itemexist.productPrice
   

//     if(store.owner.toString()===req.userVerfied._id.toString()){

//         throw new ApiError(400,"You are the owner of this store so you cannot make order on it")
//     }
//     // // Get customer details from User model
//     // const customer = await User.findById(req.user._id);
//     // if (!customer) {
//     //     throw new ApiError(404, "Customer not found");
//     // }


//     // Validate and populate items
//     // const populatedItems = [];
//     // for (const item of items) {
//     //     const { productId, quantity } = item;

//         // // Validate productId and quantity
//         // if (!productId || !quantity || quantity <= 0) {
//         //     throw new ApiError(400, "Each item must have a valid productId and quantity");
//         // }

//         // // Find the product in the specified store
//         // const product = await Product.findOne({ _id: productId, storeId });
//         // if (!product) {
//         //     throw new ApiError(404, `Product with ID ${productId} not found in this store`);
//         // }


//         //   // Populate item details from the product
//         //   populatedItems.push({
//         //     productId: product._id,
//         //     productName: product.productName,
//         //     productImages: product.productImages,
//         //     price: product.finalPrice, // Use finalPrice (after discount)
//         //     quantity,
//         //     color: product.productColors?.length > 0 ? item.color : null, // Check if color exists
//         //     size: product.productSizes?.length > 0 ? item.size : null,   // Check if size exists
//         //     subtotal: product.finalPrice * quantity
//         // });
//     // }



//     // Calculate total amount
//     const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     const shippingCost = 0;
//     const finalAmount = totalAmount + shippingCost;

//     // Create the order
//     const order = await Order.create({
//         customerId: req.userVerfied._id,
//         customerName: req.userVerfied.username,
//         customerEmail: req.userVerfied.email,
//         customerAvatar: req.userVerfied.avatar,
//         customerPhone,
//         customerAddress,
//         storeId,
//         storeOwnerId: store.owner,
//         items,  // send id of product name and quanity  and  clor and size price in array of item
//         totalAmount,
//         shippingCost,
//         finalAmount,
//         paymentMethod: paymentMethod || 'cod',
//         paymentStatus: 'pending',
//         orderStatus: 'pending',
//         notes
//     });

//     // Send notification to store owner
//     order.isNotified = true;
//     order.notificationSentAt = new Date();
//     await order.save();

//     return res.status(201).json(
//         new ApiResponse(201, order, "Order created successfully")
//     );
// });





// Create a new order
export const createOrder = asyncHandler(async (req, res) => {
    const {
        storeId,
        items,
        // customerName,
        // customerEmail,
        customerPhone,
        customerAddress,
        paymentMethod,
        notes
    } = req.body;

    // Validate required fields
    if (!storeId || !items  || !customerPhone || !customerAddress) {
        throw new ApiError(400, "All required fields must be provided");
    }

   
    // Get store details
    const store = await CreateStore.findById(storeId);
    if (!store) {
        throw new ApiError(404, "Store not found");
    }


    // const itemexit  = await Product.findById({items[0].productId,storeId:storeId})
    
    // if(!itemexit){
    //     throw new ApiError(404, "Product not found")
    // }
    
    // item = itemexist.productName
    // item = itemexist.productImages[0]
    // item = itemexist.productPrice
   

    if(store.owner.toString()===req.userVerfied._id.toString()){

        throw new ApiError(400,"You are the owner of this store so you cannot make order on it")
    }
    // // Get customer details from User model
    // const customer = await User.findById(req.user._id);
    // if (!customer) {
    //     throw new ApiError(404, "Customer not found");
    // }


    // Validate and populate items
    const populatedItems = [];
    for (const item of items) {
        const { productId, quantity } = item;

        // Validate productId and quantity
        if (!productId || !quantity || quantity <= 0) {
            throw new ApiError(400, "Each item must have a valid productId and quantity");
        }

        // Find the product in the specified store
        const product = await Product.findOne({ _id: productId, storeId });
        if (!product) {
            throw new ApiError(404, `Product with ID ${productId} not found in this store`);
        }


          // Populate item details from the product
          populatedItems.push({
            productId: product._id,
            productName: product.productName,
            productImages: product.productImages[0],
            price: product.finalPrice, // Use finalPrice (after discount)
            quantity,
            color: product.productColors?.length > 0 ? item.color : null, // Check if color exists
            size: product.productSizes?.length > 0 ? item.size : null,   // Check if size exists
            subtotal: product.finalPrice * quantity
        });
    }



    // Calculate total amount
    const totalAmount = populatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 0;
    const finalAmount = totalAmount + shippingCost;

    // Create the order
    const order = await Order.create({
        customerId: req.userVerfied._id,
        customerName: req.userVerfied.username,
        customerEmail: req.userVerfied.email,
        customerAvatar: req.userVerfied.avatar,
        customerPhone,
        customerAddress,
        storeId,
        storeOwnerId: store.owner,
        items:populatedItems,
        totalAmount,
        shippingCost,
        finalAmount,
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        notes
    });

    // Send notification to store owner
    order.isNotified = true;
    order.notificationSentAt = new Date();
    await order.save();

    return res.status(201).json(
        new ApiResponse(201, order, "Order created successfully")
    );
});

// Get all orders for a store owner
export const getStoreOrders = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Validate store ownership
    const store = await CreateStore.findById(storeId);
    if (!store) {
        throw new ApiError(404, "Store not found");
    }
    // if (store.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }

    
    // Build query
    const matchQuery = { storeId: new mongoose.Types.ObjectId(storeId) };
    // if (status) {
    //     matchQuery.orderStatus = status;
    // }

    // Get orders with pagination and user details
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    };

    const orders = await Order.aggregatePaginate(
        Order.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: "users",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customerDetails"
                }
            },
            { $unwind: "$customerDetails" },
            {
                $project: {
                    _id: 1,
                    customerName: 1,
                    customerEmail: 1,
                    customerPhone: 1,
                    customerAddress: 1,
                    items: 1,
                    totalAmount: 1,
                    shippingCost: 1,
                    finalAmount: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    orderStatus: 1,
                    trackingNumber: 1,
                    notes: 1,
                    createdAt: 1,
                    customerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                        email: 1
                    }
                }
            }
        ]),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, orders, "Store orders retrieved successfully")
    );
});

// Get a specific order
export const getOrderById = asyncHandler(async (req, res) => {
    const { orderId ,storeId} = req.params;

    const order = await Order.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
        {
            $lookup: {
                from: "users",
                localField: "customerId",
                foreignField: "_id",
                as: "customerDetails"
            }
        },
        { $unwind: "$customerDetails" },
        {
            $lookup: {
                from: "users",
                localField: "storeOwnerId",
                foreignField: "_id",
                as: "storeOwnerDetails"
            }
        },
        { $unwind: "$storeOwnerDetails" },
        {
            $lookup: {
                from: "createstores",
                localField: "storeId",
                foreignField: "_id",
                as: "storeDetails"
            }
        },
        { $unwind: "$storeDetails" },
        {
            $project: {
                _id: 1,
                customerName: 1,
                customerEmail: 1,
                customerPhone: 1,
                customerAddress: 1,
                items: 1,
                totalAmount: 1,
                shippingCost: 1,
                finalAmount: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                orderStatus: 1,
                trackingNumber: 1,
                notes: 1,
                createdAt: 1,
                customerDetails: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    email: 1
                },
                storeOwnerDetails: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    email: 1
                },
                storeDetails: {
                    storeName: 1,
                    storeLogo: 1
                }
            }
        }
    ]);

    if (!order || order.length === 0) {
        throw new ApiError(404, "Order not found");
    }

    // Check authorization
    const orderData = order[0];
    if (orderData.storeOwnerId.toString() !== req.user._id.toString() && 
        orderData.customerId?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized access");
    }

    return res.status(200).json(
        new ApiResponse(200, orderData, "Order retrieved successfully")
    );
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber } = req.body;

    if (!orderStatus) {
        throw new ApiError(400, "Order status is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // // Verify store ownership
    // const store = await CreateStore.findById(order.storeId);
    // if (store.owner.toString() !== req.user._id.toString()) {
    //     throw new ApiError(403, "Unauthorized access");
    // }

    // Update order status
    order.orderStatus = orderStatus;
    if (trackingNumber) {
        order.trackingNumber = trackingNumber;
    }

    await order.save();

    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});

// Get customer's orders
export const getCustomerOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { customerId: req.userVerfied._id };
    if (status) {
        query.orderStatus = status;
    }


    if(store.owner.toString()===req.userVerfied._id.toString()){

        throw new ApiError(400,"You are the owner of this store so you cannot make order on it")
    }

    // Get orders with pagination and store owner details
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    };

    const orders = await Order.aggregatePaginate(
        Order.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users",
                    localField: "storeOwnerId",
                    foreignField: "_id",
                    as: "storeOwnerDetails"
                }
            },
            { $unwind: "$storeOwnerDetails" },
            {
                $lookup: {
                    from: "createstores",
                    localField: "storeId",
                    foreignField: "_id",
                    as: "storeDetails"
                }
            },
            { $unwind: "$storeDetails" },
            {
                $project: {
                    _id: 1,
                    items: 1,
                    totalAmount: 1,
                    shippingCost: 1,
                    finalAmount: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    orderStatus: 1,
                    trackingNumber: 1,
                    createdAt: 1,
                    storeOwnerDetails: {
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                        email: 1
                    },
                    storeDetails: {
                        storeName: 1,
                        storeLogo: 1
                    }
                }
            }
        ]),
        options
    );

    return res.status(200).json(
        new ApiResponse(200, orders, "Customer orders retrieved successfully")
    );
});






// export const deleteOrdercustomer = 

// Delete order (for customers and store owners)
export const deleteOrderbycustomer = asyncHandler(async (req, res) => {
    const { orderId,storeId } = req.params;


  
    // const order = await Order.findById(orderId);
    const order = await Order.findOne({ _id: orderId, storeId });
    // const order = await Order.findOne({orderId , storeId})

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const customer = req.userVerfied._id.toString !== order.customerId.toString
  
    if(!customer){

        throw new ApiError("you are not the customer of this order")
    }

     

    // Check if the user is either the customer or the store owner
    // const isCustomer = order.customerId?.toString() === req.user._id.toString();
    // const isStoreOwner = order.storeOwnerId.toString() === req.user._id.toString();

    // if (!isCustomer && !isStoreOwner) {
    //     throw new ApiError(403, "Unauthorized access");
    // }

    // Additional checks based on who is deleting
   
        // Customers can only delete pending orders
        if (order.orderStatus !== 'pending') {
            throw new ApiError(400, "You can only delete pending orders");
        }
    
    


    // // Delete the order
    // await Order.findByIdAndDelete(orderId);

    order.orderStatus = 'cancelled'

    await order.save().ValidateBeforeSave(false);


    order.storeId 

    //send messege to store id 



    // Send notification to the other party

    // firebase messege to store owner 



    //      const  store  = await CreateStore.findOne({storeId,orderId})

//      if(!store){
//     throw new ApiError(404, "store not found")
// }
 
//send messege to store owner by store id 


   
    // Here you would implement your notification system
    // For example:
    // await sendNotification(
    //     isCustomer ? order.storeOwnerId : order.customerId,
    //     notificationMessage
    // );

    return res.status(200).json(
        new ApiResponse(200, order, "Order cancelled successfully")
    );
});



// Delete order (for customers and store owners)
export const  deleteOrderByOwner = asyncHandler(async (req, res) => {
    const { orderId ,storeId} = req.params;



    //  const order = await Order.findById(orderId);
     const order = await Order.findOne({_id:orderId, storeId})
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

   //if i don indexing the findone ({_Id:orderId ,storeId})


    const isCustomer  =order.customerId == req.userVerfied._id.toString();


 



if(!isCustomer){

    throw new ApiError(403, "You are not the customer of this order")
}

order.customerId 

//send notification to the customer by customerId

    


//     if(order.orderStatus !== 'delivered')

// {
//    throw new ApiError(400,"you can only delete delivered order")
// }


// Delete the order
    await Order.findByIdAndDelete(orderId);

        // Delete the order
        await Order.deleteOne({ _id: orderId, storeId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Order deleted successfully")
    );
});