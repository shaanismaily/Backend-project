import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (videoLike) {
    await Like.findByIdAndDelete(videoLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const commentLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (commentLike) {
    await Comment.findByIdAndDelete(CommentLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Comment unliked successfully"));
  }

  await Comment.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment liked successfully"));
});
