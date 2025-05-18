// In user-swagger-definitions.js

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - fullName
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         fullName:
 *           type: string
 *           description: User's full name
 *         avatar:
 *           type: string
 *           format: uri
 *           description: URL to user's avatar image
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: URL to user's cover image
 *         whatsapp:
 *           type: string
 *           description: User's WhatsApp contact
 *         storeLink:
 *           type: string
 *           description: Link to user's store
 *         facebook:
 *           type: string
 *           description: User's Facebook profile
 *         instagram:
 *           type: string
 *           description: User's Instagram profile
 *         productlink:
 *           type: string
 *           description: Link to user's product
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         username: johndoe
 *         email: john@example.com
 *         fullName: John Doe
 *         avatar: https://cloudinary.com/avatar.jpg
 *         coverImage: https://cloudinary.com/cover.jpg
 *         whatsapp: "+123456789"
 *         storeLink: https://store.example.com
 *         facebook: https://facebook.com/johndoe
 *         instagram: https://instagram.com/johndoe
 *     FollowProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         fullName:
 *           type: string
 *           description: User's full name
 *         name:
 *           type: string
 *           description: User's name
 *         email:
 *           type: string
 *           description: User's email
 *         followerCount:
 *           type: integer
 *           description: Number of followers
 *         followingCount:
 *           type: integer
 *           description: Number of users this user is following
 *         followbutton:
 *           type: boolean
 *           description: Whether the current user is following this user
 *         coverImage:
 *           type: string
 *           description: URL to user's cover image
 *         avatar:
 *           type: string
 *           description: URL to user's avatar
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *     ValidationError:
 *       description: Validation error
 */

// All endpoints below updated with /v1 in path //

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *               - avatar
 *               - coverImage
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User's avatar image
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: User's cover image
 *               whatsapp:
 *                 type: string
 *                 description: User's WhatsApp contact
 *               storeLink:
 *                 type: string
 *                 description: Link to user's store
 *               facebook:
 *                 type: string
 *                 description: User's Facebook profile
 *               instagram:
 *                 type: string
 *                 description: User's Instagram profile
 *               productlink:
 *                 type: string
 *                 description: Link to user's product
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request - Missing fields or validation error
 *       409:
 *         description: Conflict - User already exists or social links in use
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login to the application
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *               username:
 *                 type: string
 *                 description: User username
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *             example:
 *               email: john@example.com
 *               password: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout from the application
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/v1/users/re-send-otp:
 *   post:
 *     summary: Resend verification OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Email is required
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/forget-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Email is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to send reset email
 */

/**
 * @swagger
 * /api/v1/users/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newpassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               otp:
 *                 type: string
 *                 description: OTP received via email
 *               newpassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *             example:
 *               email: user@example.com
 *               otp: "123456"
 *               newpassword: "NewSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input or expired OTP
 *       401:
 *         description: Invalid OTP
 *       404:
 *         description: User not found or OTP record not found
 */

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldpassword
 *               - newpassword
 *             properties:
 *               oldpassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newpassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *             example:
 *               oldpassword: "CurrentPassword123"
 *               newpassword: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing password fields
 *       401:
 *         description: Incorrect old password or unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/current-user:
 *   get:
 *     summary: Get current user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/update-account:
 *   patch:
 *     summary: Update user account details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               whatsapp:
 *                 type: string
 *                 description: User's WhatsApp contact
 *               storeLink:
 *                 type: string
 *                 description: Link to user's store
 *               facebook:
 *                 type: string
 *                 description: User's Facebook profile
 *               instagram:
 *                 type: string
 *                 description: User's Instagram profile
 *               productlink:
 *                 type: string
 *                 description: Link to user's product
 *             example:
 *               email: john@example.com
 *               fullName: John Doe
 *               whatsapp: "+123456789"
 *               storeLink: https://store.example.com
 *               facebook: https://facebook.com/johndoe
 *               instagram: https://instagram.com/johndoe
 *               productlink: https://products.example.com/john
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Email and fullName are required or social media requirements not met
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Verified user not found
 *       409:
 *         description: Social link already in use by another user
 */

/**
 * @swagger
 * /api/v1/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema:
 *           type: string
 *         required: false
 *         description: Refresh token stored in cookie
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Alternate way to provide refresh token if not in cookie
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /api/v1/users/avatar:
 *   patch:
 *     summary: Update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User's new avatar image
 *     responses:
 *       200:
 *         description: Avatar changed successfully
 *       400:
 *         description: Avatar is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Verified user not found or avatar URL not found
 */

/**
 * @swagger
 * /api/v1/users/f/{username}:
 *   get:
 *     summary: Get user's follow information and profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to get follow information for
 *     responses:
 *       200:
 *         description: User channel fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/FollowProfile'
 *                 message:
 *                   type: string
 *                   example: User channel fetched successfully
 *       400:
 *         description: Username is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Channel does not exist
 */

/**
 * @swagger
 * /api/v1/users/cover-image:
 *   patch:
 *     summary: Update user cover image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - coverImage
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: User's new cover image
 *     responses:
 *       200:
 *         description: Cover image changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Cover image change successfully
 *                 url:
 *                   type: string
 *                   example: https://cloudinary.com/cover.jpg
 *       400:
 *         description: Cover image is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Verified user not found
 */

/**
 * @swagger
 * /api/v1/users/history:
 *   get:
 *     summary: Get user's watch history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watch history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       videoFile:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       duration:
 *                         type: number
 *                       views:
 *                         type: number
 *                       owner:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                 message:
 *                   type: string
 *                   example: Watch history fetched successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */