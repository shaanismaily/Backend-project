import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler( async(req, res) => {
    const { name, description } = req.body

    if ([name, description].some(field => field.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler( async(req, res) => {
    const { userId } = req.params

    const playlists = await Playlist.find({ owner: userId })

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler( async(req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler( async(req, res) => {
    const { videoId, playlistId } = req.params

    const video = await Video.findById(videoId);
    const playlist = await Playlist.findById(playlistId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatePlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler( async(req, res) => {
    const { videoId, playlistId } = req.params

    const video = await Video.findById(videoId);
    const playlist = await Playlist.findById(playlistId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }
    
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(404, "Video does not exists in playlist")
    }

    playlist.videos.pull(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Video removed successfully"
        )
    );
})

const deletePlaylist = asyncHandler( async(req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user._id })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler( async(req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized");
    }

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description can't be empty");
    }

    if (name) {
        playlist.name = name;
    }

    if (description) {
        playlist.description = description;
    }

    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}