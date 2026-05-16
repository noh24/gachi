'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
	const router = useRouter();

	return (
		<section className='flex flex-col items-center gap-6 text-center'>
			<div className='flex flex-col gap-4'>
				<h1 className='text-6xl font-bold'>gachi</h1>
				<div className='text-zinc-400'>
					<p className=''>swipe together</p>
					<p className=''>eat together</p>
				</div>
			</div>
			<Button
				variant='outline'
				size='icon-lg'
				onClick={() => router.push('/create-room')}
			>
				→
			</Button>
		</section>
	);
}
