import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"

const getAllVideos = asyncHandler( async(req, res) => {
    const { page=1, limit=10, query, sortBy="createdAt", sortType="desc", userId } = req.query

    const filter = {}

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        filter.owner = userId
    }

    // const mongoQuery = Video.find(filter)
    // after this we can sort the mongoQuery documents if the user passed sortBy
    // if (sortBy) {
    //     mongoQuery.sort([sortBy]: sortType === "asc" ? 1 : -1)
    // }

    const videos = await Video.find(filter)
                   .sort({ [sortBy]: sortType === "asc" ? 1 : -1 })
                   .skip((Number(page) - 1) * Number(limit))
                   .limit(Number(limit))
                
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler( async(req, res) => {
    console.log(req.files)
    const { title, description } = req.body

    if (!title?.trim()) {
        throw new ApiError(400, "Title is required")
    }
    if (!description?.trim()) {
        throw new ApiError(400, "Description is required")
    }

    const videoLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "Video upload failed");
    }

    if (!thumbnail) {
        throw new ApiError(500, "Thumbnail upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        owner: req.user?._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"))
})

export {
    getAllVideos,
    publishAVideo
}