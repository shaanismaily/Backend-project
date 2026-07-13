import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler( async(req, res) => {
   
    const stats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // Get all videos of this user
        {
            $lookup: {
                from: "videos",
                foreignField: "owner",
                localField: "_id",
                as: "videos",
            }
        },
        // Get all the subscribers of this channel
        {
            $lookup: {
                from: "subscriptions",
                foreignField: "channel",
                localField: "_id",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                let: {
                    videoIds: "$videos._id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$video", "$$videoIds"]
                            }
                        }
                    }
                ],
                as: "likes"
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: {
                    $sum: "$videos.views"
                },
                totalSubscribers: {
                    $size: "$subscribers"
                },
                totalVideos: {
                    $size: "$videos"
                },
                totalLikes: {
                    $size: "$likes"
                },
            }
        }
    ])

    if (stats.length === 0) {
        throw new ApiError(404, "Channel does not exists")
    }
    return res.status(200).json(
        new ApiResponse(200, stats[0], "Channel stats fetched successfully")
    )
})

const getChannelVideos = asyncHandler( async(req, res) => {
    const videos = await Video.find({ owner: req.user._id })
        .sort({ createdAt: -1 });

    if (videos.length === 0) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res.status(200).json(new ApiResponse(
        200, videos, "Videos fetched successfully"
    ))
})

export {
    getChannelStats,
    getChannelVideos
}