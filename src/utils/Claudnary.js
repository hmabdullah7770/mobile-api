// hls with cmaf

// with CMAF + HLS for modern video streaming

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

cloudinary.config({
    cloud_name: process.env.CLAUDNARY_NAME,
    api_key: process.env.CLAUDNARY_KEY,
    api_secret: process.env.CLAUDNARY_SECRET
});

const uploadResult = async (localfile, isVideo = false) => {
    try {
        if (!localfile) {
            return null;
        }

        // Auto-detect if not specified
        if (!isVideo) {
            const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'wav', 'webp'];
            const fileExtension = localfile.split('.').pop().toLowerCase();
            isVideo = videoExtensions.includes(fileExtension);
        }

        // Determine upload options based on file type
        const uploadOptions = {
            resource_type: isVideo ? "video" : "auto"
        };

        // Add video-specific optimizations for CMAF + HLS
        if (isVideo) {
            uploadOptions.eager = [
                // CMAF with HLS (modern, uses fMP4 segments)
                { 
                    streaming_profile: "auto",  // ← This enables CMAF!
                    format: "m3u8"
                },
                // Optional: CMAF with DASH (for wider compatibility)
                { 
                    streaming_profile: "auto",
                    format: "mpd"
                }
            ];
            uploadOptions.eager_async = true;
        }

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(
            localfile, 
            uploadOptions
        );

        console.log('File uploaded to Cloudinary:', response.url);
        
        // Generate CMAF streaming URLs if video
        if (isVideo && response.public_id) {
            // HLS URL with CMAF (fMP4 segments)
            const hlsUrl = cloudinary.url(response.public_id, {
                resource_type: 'video',
                format: 'm3u8',
                transformation: [
                    { streaming_profile: 'auto' }  // CMAF enabled
                ]
            });
            
            // DASH URL with CMAF (same segments, different manifest)
            const dashUrl = cloudinary.url(response.public_id, {
                resource_type: 'video',
                format: 'mpd',
                transformation: [
                    { streaming_profile: 'auto' }  // CMAF enabled
                ]
            });
            
            response.hlsUrl = hlsUrl;
            response.dashUrl = dashUrl;
            
            console.log('HLS URL (CMAF):', hlsUrl);
            console.log('DASH URL (CMAF):', dashUrl);
        }
        
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



// with hls for videos chucks 

// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import { promisify } from 'util';

// const unlinkAsync = promisify(fs.unlink);

// cloudinary.config({
//     cloud_name: process.env.CLAUDNARY_NAME,
//     api_key: process.env.CLAUDNARY_KEY,
//     api_secret: process.env.CLAUDNARY_SECRET
// });

// const uploadResult = async (localfile, isVideo = false) => {
//     try {
//         if (!localfile) {
//             return null;
//         }

//         // Auto-detect if not specified
//         if (!isVideo) {
//             const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', 'wav', 'webp'];
//             const fileExtension = localfile.split('.').pop().toLowerCase();
//             isVideo = videoExtensions.includes(fileExtension);
//         }

//         // Determine upload options based on file type
//         const uploadOptions = {
//             resource_type: isVideo ? "video" : "auto"
//         };

//         // Add video-specific optimizations for HLS
//         if (isVideo) {
//             uploadOptions.eager = [
//                 { 
//                     streaming_profile: "hd",
//                     format: "m3u8"
//                 }
//             ];
//             uploadOptions.eager_async = true;
//         }

//         // Upload to Cloudinary
//         const response = await cloudinary.uploader.upload(
//             localfile, 
//             uploadOptions
//         );

//         console.log('File uploaded to Cloudinary:', response.url);
        
//         // Generate HLS URL if video
//         if (isVideo && response.public_id) {
//             const hlsUrl = cloudinary.url(response.public_id, {
//                 resource_type: 'video',
//                 format: 'm3u8',
//                 transformation: [
//                     { streaming_profile: 'hd' }
//                 ]
//             });
            
//             response.hlsUrl = hlsUrl;
//             console.log('HLS URL:', hlsUrl);
//         }
        
//         // OPTIMIZATION: Non-blocking async file deletion
//         unlinkAsync(localfile).catch(err => 
//             console.error('Failed to delete local file:', err)
//         );
        
//         return response;
       
//     } catch (error) {
//         console.error('Upload error:', error);
        
//         // Cleanup on error (non-blocking)
//         if (fs.existsSync(localfile)) {
//             unlinkAsync(localfile).catch(err => 
//                 console.error('Failed to delete local file after error:', err)
//             );
//         }
        
//         return null;
//     }
// }

// export { uploadResult }


// //unlink without await

// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import { promisify } from 'util';

// const unlinkAsync = promisify(fs.unlink);

// cloudinary.config({
//     cloud_name: process.env.CLAUDNARY_NAME,
//     api_key: process.env.CLAUDNARY_KEY,
//     api_secret: process.env.CLAUDNARY_SECRET
// });

// const uploadResult = async (localfile) => {
//     try {
//         if (!localfile) {
//             return null;
//         }

//         // Upload to Cloudinary
//         const response = await cloudinary.uploader.upload(
//             localfile, 
//             { resource_type: "auto" }
//         );

//         console.log('File uploaded to Cloudinary:', response.url);
        
//         // OPTIMIZATION: Non-blocking async file deletion
//         unlinkAsync(localfile).catch(err => 
//             console.error('Failed to delete local file:', err)
//         );
        
//         return response;
       
//     } catch (error) {
//         console.error('Upload error:', error);
        
//         // Cleanup on error (non-blocking)
//         if (fs.existsSync(localfile)) {
//             unlinkAsync(localfile).catch(err => 
//                 console.error('Failed to delete local file after error:', err)
//             );
//         }
        
//         return null;
//     }
// }

// export { uploadResult }



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

