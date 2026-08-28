import { getAnnouncement, getVisibleAnnouncements } from "@/modules/announcements/services/announcements";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: announcement } = await getAnnouncement(id);

  if (!announcement) {
    notFound();
  }

  const { data } = await getVisibleAnnouncements(1, 50);
  const allAnnouncements = data || [];
  const currentIndex = allAnnouncements.findIndex((a) => a.id === id);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-background border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-background-alt/50">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {announcement.type === "important" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-background">
                  Important
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border text-muted capitalize">
                {announcement.type.replace("_", " ")}
              </span>
              <span className="text-xs text-muted capitalize">{announcement.priority} priority</span>
            </div>
            <h1 className="text-xl md:text-2xl font-serif text-foreground">{announcement.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted">
              <span>{new Date(announcement.published_at || announcement.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}</span>
              {announcement.expires_at && (
                <>
                  <span>·</span>
                  <span>Expires {new Date(announcement.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </>
              )}
            </div>
          </div>
          <div className="px-6 py-6">
            {announcement.description && (
              <p className="text-base text-foreground/80 leading-relaxed mb-4 font-medium">
                {announcement.description}
              </p>
            )}
            {announcement.content && (
              <div
                className="text-sm text-muted leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: announcement.content }}
              />
            )}
          </div>
        </div>

        {currentIndex >= 0 && currentIndex < allAnnouncements.length - 1 && (
          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-xs text-muted uppercase tracking-wide mb-3">Next announcement</p>
            <Link
              href={`/announcements/${allAnnouncements[currentIndex + 1].id}`}
              className="block p-4 bg-background-alt border border-border rounded-xl hover:border-foreground/20 transition-colors"
            >
              <p className="text-sm font-medium text-foreground">
                {allAnnouncements[currentIndex + 1].title}
              </p>
              <p className="text-xs text-muted mt-1">Next &rarr;</p>
            </Link>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/announcements" className="text-sm text-muted hover:text-foreground transition-colors">
            &larr; Back to all announcements
          </Link>
        </div>
      </div>
    </div>
  );
}
