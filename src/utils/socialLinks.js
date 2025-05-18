import { ApiError } from "./ApiErrors.js";

export const processSocialLinks = (user, payload, existingCard = null) => {
    const socialLinks = {};
    const errors = [];
    const allowedLinks = ['whatsapp', 'storeLink', 'facebook', 'instagram', 'productlink'];

    allowedLinks.forEach(link => {
        const payloadValue = payload[link];
        if (payloadValue === true || payloadValue?.toLowerCase() === 'true') {
            const userValue = user[link];

            console.log(`Processing ${link}:`, {
                payloadValue,
                type: typeof payloadValue,
                isTrue: payloadValue === true,
                isStringTrue: payloadValue?.toLowerCase?.() === 'true'
            });
            
            if (typeof userValue === 'number' && userValue > 0) {
                socialLinks[link] = userValue;
            } else if (typeof userValue === 'string' && userValue.trim() !== '') {
                socialLinks[link] = userValue;
            } else {
                errors.push(`${link} not configured in profile`);
            }
            console.log(`User value for ${link}:`, {
                userValue,
                type: typeof userValue,
                isNumber: typeof userValue === 'number',
                isGreaterThanZero: userValue > 0,
                condition: typeof userValue === 'number' && userValue > 0
            });
        
        
        }
    });

    if (errors.length > 0) {
        throw new ApiError(400, errors.join(', '));
    }

    // CREATE SCENARIO (FIXED RETURN)
    if (!existingCard) {
        if (Object.keys(socialLinks).length === 0) {
            throw new ApiError(400, "At least one social link required");
        }
        return  {socialLinks} ; // CHANGED: Return the wrapped object
    }
    
    
    // ... rest of update logic ...

 
 
    // UPDATE SCENARIO
 const updateOps = { $set: {}, $unset: {} };
    
 // Process links that should be added/updated
 Object.keys(socialLinks).forEach(link => {
     updateOps.$set[link] = socialLinks[link];
 });
 
 // Process links that should be removed (those not in the payload)
 allowedLinks.forEach(link => {
     // If link exists in card but not in the new social links, unset it
     if (existingCard[link] && !socialLinks[link] && payload[link] === false) {
         updateOps.$unset[link] = "";
     }
 });

// Clean up empty operators
if (Object.keys(updateOps.$set).length === 0) delete updateOps.$set;
if (Object.keys(updateOps.$unset).length === 0) delete updateOps.$unset;

return updateOps;

};

