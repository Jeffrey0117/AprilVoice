import { Link } from 'react-router-dom';

export function AboutPage() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      title: '雙向顯示',
      description: '上半螢幕旋轉 180 度，讓對面的人也能看到文字',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
      title: '多 ASR 引擎',
      description: '支援 Azure、Google Cloud、OpenAI Whisper',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: '智慧帳號輪換',
      description: '自動切換帳號，最大化免費額度使用',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
      title: '本地運算支援',
      description: 'faster-whisper 本地模型（未來支援 GPU）',
    },
  ];

  const techStack = [
    {
      category: '前端',
      color: 'from-blue-500 to-blue-600',
      items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    },
    {
      category: '後端',
      color: 'from-emerald-500 to-emerald-600',
      items: ['FastAPI', 'WebSocket', 'Python'],
    },
    {
      category: 'ASR 引擎',
      color: 'from-purple-500 to-purple-600',
      items: ['faster-whisper（本地）', '雲端 API'],
    },
  ];

  const roadmap = [
    { title: 'GPU 加速支援', status: '規劃中' },
    { title: '更多語言支援', status: '規劃中' },
    { title: '離線模式', status: '規劃中' },
    { title: '行動裝置 App', status: '規劃中' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">關於 AprilVoice</h1>
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>返回首頁</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              AprilVoice
            </h2>
            <p className="text-xl text-gray-300">即時語音轉文字應用</p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-300 leading-relaxed text-center">
              AprilVoice 是一個專為溝通場景設計的即時語音轉文字工具。
              <br />
              無論是與聽障朋友交流，還是需要即時字幕的各種場合，
              <br />
              我們都希望提供一個便利、免費的解決方案。
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            功能特色
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-5 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            技術架構
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {techStack.map((stack) => (
              <div
                key={stack.category}
                className="overflow-hidden rounded-lg border border-gray-700"
              >
                <div className={`px-4 py-3 bg-gradient-to-r ${stack.color}`}>
                  <h4 className="font-semibold text-white">{stack.category}</h4>
                </div>
                <div className="p-4 bg-gray-800">
                  <ul className="space-y-2">
                    {stack.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-gray-300"
                      >
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Motivation */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            開發動機
          </h3>
          <div className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/30">
            <p className="text-gray-300 leading-relaxed">
              AprilVoice 的誕生，源自於想為聽障朋友或需要即時字幕的場景提供便利工具的初衷。
              透過整合多家雲端語音辨識服務，配合智慧帳號輪換系統，讓使用者可以免費享受高品質的即時語音轉文字體驗。
              我們相信，科技應該讓溝通更加無障礙。
            </p>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            未來規劃
          </h3>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-700">
              {roadmap.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-750 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <span className="text-gray-200">{item.title}</span>
                  <span className="px-3 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-gray-700">
          <p className="text-gray-500 text-sm">
            AprilVoice - 開源語音辨識工具
          </p>
          <div className="mt-4">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              開始使用
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default AboutPage;
