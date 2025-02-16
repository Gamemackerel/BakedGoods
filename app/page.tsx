import { Link } from 'lucide-react'
import BakedGoodsGame from './components/BakedGoodsGame'

export default function Home() {
  return (
    <main className="min-h-screen">
      <BakedGoodsGame />
      <footer className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
        <a className='hover:underline' href='https://github.com/Gamemackerel/BakedGoods'>View on GitHub</a>
      </footer>
    </main>
  )
}