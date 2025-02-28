export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Your Feed</h1>
        <p className="text-muted-foreground">
          See the latest posts from people you follow
        </p>
      </div>

      <div className="border p-8 rounded-lg text-center">
        <p className="text-muted-foreground">
          Feed content will be displayed here. We'll build this in the next
          step!
        </p>
      </div>
    </div>
  );
}
