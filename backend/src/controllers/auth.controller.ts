import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessTokenAndRefreshToken } from "../utils/generateToken.js";
import { accessCookieOptions, refreshCookieOptions } from "../config/cookie.config.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, skills, location } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User Already Exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    skills,
    location,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, {user: createdUser}, "User Registered successfully"));
});

export const loginUser = asyncHandler(async(req, res)=>{
     const { email, password } = req.body

     if(!email || !password){
        throw new ApiError(400, "email and password are required")
     }

   const user = await User.findOne({email})

   if(!user){
      throw new ApiError(404, "User doesn't exist")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
     throw new ApiError(401, "Invalid user credentials")
   }

   const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id.toString())

    const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
          },
          "User loggedIn successfully"
        )
      );
})
