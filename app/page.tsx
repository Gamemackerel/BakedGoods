import BakedGoodsGame from './components/BakedGoodsGame'

export default function Home() {
  return (
    <main>
      <BakedGoodsGame />
      <footer className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 z-[-1]">
        <a className='hover:underline' href='https://github.com/Gamemackerel/BakedGoods'>View on GitHub</a>
      </footer>
    </main>
  )
}