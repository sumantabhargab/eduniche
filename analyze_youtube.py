import json
from youtube_transcript_api import YouTubeTranscriptApi

VIDEO_ID = "J97NGqk131s"
URL = f"https://www.youtube.com/watch?v={VIDEO_ID}"

# --- 1. Video metadata via yt-dlp (more reliable than pytube) ---
try:
    import yt_dlp

    ydl_opts = {"quiet": True, "no_warnings": True, "skip_download": True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(URL, download=False)

    print("=" * 60)
    print("VIDEO METADATA")
    print("=" * 60)
    print(f"Title       : {info.get('title')}")
    print(f"Channel     : {info.get('channel')} / {info.get('uploader')}")
    print(f"Channel URL : {info.get('channel_url')}")
    print(f"Duration    : {info.get('duration_string')} ({info.get('duration')}s)")
    print(f"Views       : {info.get('view_count')}")
    print(f"Likes       : {info.get('like_count')}")
    print(f"Upload Date : {info.get('upload_date')}")
    print(f"Description :")
    desc = info.get("description", "") or ""
    print(desc[:3000])
    print("=" * 60)

    # Save full metadata for reference
    with open("video_metadata.json", "w", encoding="utf-8") as f:
        safe = {k: v for k, v in info.items() if k not in ("formats", "thumbnails")}
        json.dump(safe, f, indent=2, ensure_ascii=False, default=str)
    print("\nFull metadata saved to video_metadata.json")

except Exception as e:
    print(f"yt-dlp metadata error: {e}")

# --- 2. Transcript ---
print("\n" + "=" * 60)
print("TRANSCRIPT")
print("=" * 60)
try:
    transcript_list = YouTubeTranscriptApi.list_transcripts(VIDEO_ID)

    # Try to get manual transcript first, then auto-generated
    transcript = None
    for t in transcript_list:
        if not t.is_generated:
            transcript = t
            print(f"\nSource: Manual transcript ({t.language})")
            break

    if transcript is None:
        for t in transcript_list:
            if t.is_generated:
                transcript = t
                print(f"\nSource: Auto-generated transcript ({t.language})")
                break

    if transcript:
        segments = transcript.fetch()
        full_text = " ".join(seg["text"] for seg in segments)
        print(f"\nTotal segments: {len(segments)}")
        print(f"Word count    : {len(full_text.split())}")
        print("\n--- FULL TRANSCRIPT ---\n")
        print(full_text)

        with open("video_transcript.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        print("\n\nTranscript saved to video_transcript.txt")
    else:
        print("No transcript available for this video.")

except Exception as e:
    print(f"Transcript error: {e}")
