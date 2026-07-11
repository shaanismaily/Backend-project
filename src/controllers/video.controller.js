import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
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
        videoFilePublicId: videoFile.public_id,
        thumbnail: thumbnail.secure_url,
        thumbnailPublicId: thumbnail.public_id,
        owner: req.user?._id,
        duration: videoFile.duration
    })

    return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"))
})

const getVideoById = asyncHandler( async(req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler( async(req, res) => {
    const { videoId } = req.params
    const thumbnailLocalPath = req.file?.path
    const { title, description } = req.body

    if (title !== undefined && title.trim() === "") {
        throw new ApiError(400, "Title cannot be empty");
    }

    if (description !== undefined && description.trim() === "") {
        throw new ApiError(400, "Description cannot be empty");
    }

    const oldVideo = await Video.findById(videoId)

    if (!oldVideo) {
        throw new ApiError(404, "Video not found");
    }

    if (oldVideo.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    let thumbnail;
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnail?.secure_url) {
            throw new ApiError(400, "Error while updating thumbnail")
        }
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title ?? oldVideo.title,
                description: description ?? oldVideo.description,
                thumbnail: thumbnail?.secure_url || oldVideo.thumbnail,
                thumbnailPublicId: thumbnail?.public_id || oldVideo.thumbnailPublicId
            }
        },
        { new: true }
    )

    if (thumbnail) {
        try {
            await cloudinary.uploader.destroy(oldVideo.thumbnailPublicId)
        } catch (error) {
            console.error("Failed to delete old thumbnail")
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Fields updated successfully"))
})

const deleteVideo = asyncHandler( async(req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    try {
        await cloudinary.uploader.destroy(video.videoFilePublicId);
        await cloudinary.uploader.destroy(video.thumbnailPublicId);
    } catch (err) {
        throw new ApiError(500, "Failed to delete files from Cloudinary");
    }

    await video.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished

    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, "Publish status toggled successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}