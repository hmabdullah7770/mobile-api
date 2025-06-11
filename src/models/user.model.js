import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

//i want to use one of them of them (watsapp,storelink,facebook,instaram)  is required use enum or other to make reuired in enum we select one of them but we can select multiple of them or all or one of them so validation is at lest one of them is required

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true


    },
    otp: { type: String, required: true },
    bio:{
        type: String,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    age:{type: Number , required: true},
    gender:{
        type: String,
        enum: ['male', 'female', 'transgender', 'other'],
        required: true,
    },
    // addtoFavouret: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Video",
    // }
    
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }],
    avatar: {
        type: String,  //cloudnary url
        required: true
    },

    // title:{
    //    type: String,
    //      default: "No title provided"
    // },
 

    coverImage: {
        type: String,  //cloudnary url

    },
    refreshToken: {
        type: String,

    },

    whatsapp:{
        type:Number,
        unique:true,
        sparse: true
    },
     
    storeLink:{
        type:String,
        unique:true,
        sparse: true
       
    }
   ,
    facebook:{
        type:String,
        unique:true,
        sparse: true
       
    }
    ,
    instagram:{
        type:String,
        unique:true,
        sparse: true
     

    },

    productlink:{
        type:String,
    },

      
    stores: [{
            

        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CreateStore"
        },
        storeName: {
            type: String
        },
        storeLogo: {
            type: String
        }
        
    }],

    //likevideo:
    //commentvideo:
}, { timestamps: true })



//delete user also delete the user all data and also store and store data 

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.getAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullName,
            username: this.username,
        }
     ,
        process.env.ACCESS_TOKEN_SECRET
    
        , {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })

}

userSchema.methods.getRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET
   
        , {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)


}

// Custom validator to ensure at least one social link is provided
userSchema.pre('validate', function(next) {
    if (
    // this.isNew && // Only check for at least one social link if this is a new document
        !this.whatsapp && 
         !this.storeLink && 
        !this.facebook && 
        !this.instagram
    ) {
        this.invalidate('socialLinks', 'At least one social link (WhatsApp, storeLink, Facebook, or Instagram) is required');
    }
    next();
});

export const User = mongoose.model('User', userSchema)
