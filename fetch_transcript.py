from youtube_transcript_api import YouTubeTranscriptApi

VIDEO_ID = "J97NGqk131s"

print("=" * 60)
print("TRANSCRIPT")
print("=" * 60)
try:
    # v1.x API
    api = YouTubeTranscriptApi()
    transcript_list = api.list(VideoId=VIDEO_ID)

    for t in transcript_list:
        print(f"\nAvailable transcript: language={t.language}, is_generated={t.is_generated}")

    # Fetch first available
    result = api.fetch(VideoId=VIDEO_ID, Languages=["en"])
    segments = result.to_raw_data()

    full_text = " ".join(seg["text"] for seg in segments)
    print(f"\nTotal segments : {len(segments)}")
    print(f"Word count    : {len(full_text.split())}")
    print("\n--- FULL TRANSCRIPT ---\n")
    print(full_text)

    with open("video_transcript.txt", "w", encoding="utf-8") as f:
        f.write(full_text)
    print("\n\nTranscript saved to video_transcript.txt")

except Exception as e2:
    print(f"v1 API error: {e2}")
    # Fallback: try direct fetch
    try:
        from youtube_transcript_api import Transcript

        result = YouTubeTranscriptApi.get_transcript(VIDEO_ID)
        full_text = " ".join(seg["text"] for seg in result)
        print(f"\nTotal segments : {len(result)}")
        print(f"Word count    : {len(full_text.split())}")
        print("\n--- FULL TRANSCRIPT ---\n")
        print(full_text)

        with open("video_transcript.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        print("\n\nTranscript saved to video_transcript.txt")
    except Exception as e3:
        print(f"Fallback error: {e3}")
        # Try yt-dlp for subtitles
        import yt_dlp

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "writesubtitles": True,
            "subtitleslangs": ["en"],
            "subtitlesformat": "vtt",
            "outtmpl": "/tmp/yt_sub",
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(f"https://www.youtube.com/watch?v={VIDEO_ID}", download=False)

        import os, glob

        files = glob.glob("/tmp/yt_sub*.vtt")
        if files:
            import re

            with open(files[0], "r", encoding="utf-8") as f:
                vtt = f.read()
            clean = re.sub(r"<[^>]+>", "", vtt)
            clean = re.sub(r"\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}", "", clean)
            lines = [l.strip() for l in clean.splitlines() if l.strip() and not l.strip().startswith("WEBVTT")]
            full_text = " ".join(lines)
            print(f"\nWord count    : {len(full_text.split())}")
            print("\n--- FULL TRANSCRIPT ---\n")
            print(full_text)
            with open("video_transcript.txt", "w", encoding="utf-8") as f:
                f.write(full_text)
            print("\n\nTranscript saved to video_transcript.txt")
        else:
            print("No subtitle files found via yt-dlp either.")
            print("\nAvailable subtitles info:")
            with yt_dlp.YoutubeDL({"quiet": True}) as ydl:
                info = ydl.extract_info(f"https://www.youtube.com/watch?v={VIDEO_ID}", download=False)
                subs = info.get("subtitles", {})
                auto = info.get("automatic_captions", {})
                print(f"Manual subs : {list(subs.keys())}")
                print(f"Auto captions: {list(auto.keys())}")
