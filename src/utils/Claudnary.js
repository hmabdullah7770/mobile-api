//unlink without await

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

cloudinary.config({
    cloud_name: process.env.CLAUDNARY_NAME,
    api_key: process.env.CLAUDNARY_KEY,
    api_secret: process.env.CLAUDNARY_SECRET
});

const uploadResult = async (localfile) => {
    try {
        if (!localfile) {
            return null;
        }

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(
            localfile, 
            { resource_type: "auto" }
        );

        console.log('File uploaded to Cloudinary:', response.url);
        
        // OPTIMIZATION: Non-blocking async file deletion
        unlinkAsync(localfile).catch(err => 
            console.error('Failed to delete local file:', err)
        );
        
        return response;
       
    } catch (error) {
        console.error('Upload error:', error);
        
        // Cleanup on error (non-blocking)
        if (fs.existsSync(localfile)) {
            unlinkAsync(localfile).catch(err => 
                console.error('Failed to delete local file after error:', err)
            );
        }
        
        return null;
    }
}

export { uploadResult }



// with async await 

// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import { promisify } from 'util';

// const unlinkAsync = promisify(fs.unlink);

// // Configuration
// cloudinary.config({
//     cloud_name: process.env.CLAUDNARY_NAME,
//     api_key: process.env.CLAUDNARY_KEY,
//     api_secret: process.env.CLAUDNARY_SECRET
// });

// // Upload an image
// const uploadResult = async (localfile) => {
//     try {
//         if (!localfile) {
//             return null;
//         }

//         // Upload the file to Cloudinary
//         const response = await cloudinary.uploader.upload(
//             localfile, 
//             {
//                 resource_type: "auto"
//             }
//         );

//         console.log('File uploaded to Cloudinary:', response.url);
        
//         // DELETE the local file after successful upload (async)
//         try {
//             if (fs.existsSync(localfile)) {
//                 await unlinkAsync(localfile);
//                 console.log('Local file deleted:', localfile);
//             }
//         } catch (unlinkError) {
//             console.error('Failed to delete local file:', unlinkError);
//             // Don't throw - file was uploaded successfully
//         }
        
//         return response;
       
//     } catch (error) {
//         console.error('Upload error:', error);
        
//         // DELETE the local file even if upload failed
//         try {
//             if (fs.existsSync(localfile)) {
//                 await unlinkAsync(localfile);
//                 console.log('Local file deleted after error:', localfile);
//             }
//         } catch (unlinkError) {
//             console.error('Failed to delete local file:', unlinkError);
//         }
        
//         return null;
//     }
// }

// export { uploadResult }





//old
// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';



// // Configuration
// cloudinary.config({
//     cloud_name: process.env.CLAUDNARY_NAME,
//     api_key: process.env.CLAUDNARY_KEY,
//     api_secret: process.env.CLAUDNARY_SECRET
//     // Click 'View API Keys' above to copy your API secret
// });

// // Upload an image
// const uploadResult = async (localfile) => {



//     try {
//         if (!localfile) {
//             return null
//         }
//         //upload the file on cloudnary
//         const response = await cloudinary.uploader.upload(
//             localfile, {          //type of uploading i.e image, video 
//             //  if auto it allow all of them
//             resource_type: "auto"
//             // folder: "temp"
//         },
//             //file has been uploaded    
          
//         )
//         console.log('file has been uploaded on claudnary', response.url)
        
//         fs.existsSync(localfile) 
//         return response
     
//         // console.log(uploadResult);
       
//     } catch (error) {
//         fs.existsSync(localfile) //remove the locally save temporay file
//         console.log(error);
//     }
// }

// // console.log(autoCropUrl);

// export { uploadResult }

