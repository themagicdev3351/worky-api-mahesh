const tokenResponseObject = {
    authFailed: { message: 'Failed to authenticate token.' },
    unauthUser: { message: 'Missing or invalid authentication token.' },
    noTokenPro: { message: 'No token provided.' },
    tokenError: { message: 'Error with token' },
    tokenExpired: { message:  `Your current session was expired. Please try to login again.`}
}

const staticResponseMessageObject =  {
    badRequest : { message: `The request cannot be fulfilled due to bad syntax` },
    emailNotVerified: { message: `Your email is not verified. Please check your email and verify it's you.` },
    userRegisterFailed: { message: `Failed to create User, Please try again later.` },
    userRegisteredSendVerifiedMail: { message: `User registered successfully. Please check your email and verify it's you.` },
    emailAlreadyVerified: { message: `Your email already verified.` },
    verificationTokenExpired: { message: `Verification email link expired. Please get new one.` },
    verificationDataNotUpdated: { message: `Error while update user verification details.` },
    googleLoginFailed: { message: `Google login failed. Try again` },
    wrongPassword: { message: `Your currunt password is wrong` },
    duplicatePassword: { message: `Old password and new password cannot be same` },
    somethingWentToWrong: { message: `Something went wrong please try again` },
    emailNotSent: { message: `WE can't send mail, check you have enter live mailing address.` },
    fileTooLarge: { message: `File size too large, Please upload appropriate file.` },
    invalidMimeType: { message: `Invalid selected file type. Select valid file type.` },
}

module.exports = {
    responseMessageObject: async (name, action) => {
        success = `${name} ${action} successfully`
        error = `${name} not ${action}`
        alreadyExistError = `${name} already exist`
        notExistError = `${name} not exist`
        notFoundError = `${name} not found`   
        invalidProp = `Invalid ${name}`
        required = `${name} is required`
        notProvided = `Please provide ${name}`
        addProperProperty = `Please provide proper ${name}`
        alreadySubmittedError = `${name} already submitted`
        return { success, error, alreadyExistError, notExistError, notFoundError, invalidProp, required, notProvided, addProperProperty, alreadySubmittedError }
    },
    tokenResponseObject,
    staticResponseMessageObject
};