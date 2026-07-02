'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentGalleryPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard/gallery');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center text-gray-500">
        <p>Redirecting to Gallery...</p>
      </div>
    </div>
  );
}
