import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler( async(req, res) => {
    const { page=1, limit=10 } = req.query

    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comments = await Comment.find({ video: videoId })
    .populate("owner", "username avatar")
    .sort({createdAt: -1})
    .skip((Number(page)-1) * Number(limit))
    .limit(Number(limit))

    return res.status(200).json(new ApiResponse
        (200, comments, "Comments fetched successfully")
    )
})

const addComment = asyncHandler( async(req, res) => {
    const { videoId } = req.params
    const owner = req.user
    const { content } = req.body
    console.log("hello from add comment")

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!owner) {
        throw new ApiError(401, "You are not authorized")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment cannot be empty");
    }

    const comment = await Comment.create({
        owner: req.user._id,
        content,
        video: videoId
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding the comment")
    }

    return res.status(200).json(new ApiResponse(
        200, comment, "Comment added successfully"
    ));
})

const updateComment = asyncHandler( async(req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    console.log(req.user)

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    
    if (req.user._id.toString() !== comment.owner.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    comment.content = content
    await comment.save();
    
    return res.status(201).json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler( async(req, res) => {
    const { commentId } = req.params

    const comment = await findById(commentId)

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    await comment.deleteOne()

    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}