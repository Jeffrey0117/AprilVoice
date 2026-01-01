import { Link } from 'react-router-dom';

export default function HomePage() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: '多平台 API 支援',
      description: 'Azure、Google、OpenAI 語音辨識服務',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: '多帳號輪換系統',
      description: '智慧切換多組 API 金鑰',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: '免費額度最大化',
      description: '充分利用各平台免費方案',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      title: '本地 GPU 支援',
      description: '即將推出 - 離線語音辨識',
    },
  ];

  const actionCards = [
    {
      title: '開始使用',
      description: '立即體驗語音轉文字功能',
      link: '/app',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      title: '申請教學',
      description: '了解如何申請各平台 API',
      link: '/tutorial',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      title: '關於我們',
      description: '認識 AprilVoice 專案',
      link: '/about',
      color: 'from-emerald-500 to-emerald-600',
      hoverColor: 'hover:from-emerald-600 hover:to-emerald-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          AprilVoice
        </h1>
        <h2 className="mt-4 text-2xl md:text-3xl text-gray-300 font-light">
          即時語音轉文字
        </h2>
        <p className="mt-6 text-lg text-gray-400 text-center max-w-2xl">
          整合多家雲端語音辨識服務，透過智慧帳號輪換系統，讓您免費享受高品質的即時語音轉文字體驗。
        </p>
      </section>

      {/* Action Cards */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {actionCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className={`block p-6 rounded-xl bg-gradient-to-br ${card.color} ${card.hoverColor} transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
            >
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-white/80 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-semibold text-center text-gray-200 mb-12">
            功能特色
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center p-6 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors duration-300"
              >
                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-medium text-gray-200 mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-gray-500 text-sm">
        <p>AprilVoice - 開源語音辨識工具</p>
      </footer>
    </div>
  );
}
