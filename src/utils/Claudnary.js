import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



// Configuration
cloudinary.config({
    cloud_name: process.env.CLAUDNARY_NAME,
    api_key: process.env.CLAUDNARY_KEY,
    api_secret: process.env.CLAUDNARY_SECRET
    // Click 'View API Keys' above to copy your API secret
});

// Upload an image
const uploadResult = async (localfile) => {



    try {
        if (!localfile) {
            return null
        }
        //upload the file on cloudnary
        const response = await cloudinary.uploader.upload(
            localfile, {          //type of uploading i.e image, video 
            //  if auto it allow all of them
            resource_type: "auto"
            // folder: "temp"
        },
            //file has been uploaded    
          
        )
        console.log('file has been uploaded on claudnary', response.url)
        
        fs.existsSync(localfile) 
        return response
     
        // console.log(uploadResult);
       
    } catch (error) {
        fs.existsSync(localfile) //remove the locally save temporay file
        console.log(error);
    }
}

// console.log(autoCropUrl);

export { uploadResult }

