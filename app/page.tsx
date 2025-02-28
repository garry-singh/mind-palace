import Feed from "@/components/Feed";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold mb-4">Home</h1>
      </div>

      <Feed />
    </div>
  );
}
