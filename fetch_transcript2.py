from youtube_transcript_api import YouTubeTranscriptApi

VIDEO_ID = "J97NGqk131s"

print("=" * 60)
print("TRANSCRIPT")
print("=" * 60)

try:
    api = YouTubeTranscriptApi()

    # List available transcripts
    available = api.list(video_id=VIDEO_ID)
    print(f"\nAvailable transcripts:")
    for t in available:
        print(f"  - {t.language} ({t.language_code}), generated={t.is_generated}")

    # Fetch English
    result = api.fetch(video_id=VIDEO_ID, languages=["en"])
    segments = result.to_raw_data()

    full_text = " ".join(seg["text"] for seg in segments)
    print(f"\nTotal segments : {len(segments)}")
    print(f"Word count    : {len(full_text.split())}")

    # Print first 5000 chars
    print("\n--- FULL TRANSCRIPT (first 5000 chars) ---\n")
    print(full_text[:5000])
    if len(full_text) > 5000:
        print(f"\n... [truncated, total {len(full_text)} chars]")

    with open("video_transcript.txt", "w", encoding="utf-8") as f:
        f.write(full_text)
    print("\nTranscript saved to video_transcript.txt")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
