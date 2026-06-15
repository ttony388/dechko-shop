export default function ShopLoading() {
  return (
    <div className="container-shell py-14 md:py-20">
      <div className="h-12 w-2/3 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-12 grid gap-9 lg:grid-cols-[230px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-[1.8rem] bg-white lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="aspect-[.78] animate-pulse rounded-[1.8rem] bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
