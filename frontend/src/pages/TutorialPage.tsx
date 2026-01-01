import { useState } from 'react';
import { Link } from 'react-router-dom';

type TabKey = 'azure' | 'google' | 'openai';

interface TabContent {
  title: string;
  icon: string;
  badge: string;
  badgeColor: string;
  steps: { title: string; content: string }[];
}

const tabContents: Record<TabKey, TabContent> = {
  azure: {
    title: 'Azure Speech',
    icon: '🔷',
    badge: '最推薦',
    badgeColor: 'bg-green-500',
    steps: [
      {
        title: '前往 Azure Portal',
        content: '開啟瀏覽器，前往 https://portal.azure.com',
      },
      {
        title: '註冊 Microsoft 帳號',
        content:
          '如果沒有 Microsoft 帳號，點擊「建立帳戶」進行註冊。可以使用任何 email 地址。',
      },
      {
        title: '搜尋 Speech Services',
        content:
          '登入後，在頂部搜尋欄輸入「Speech Services」或「語音服務」，點擊進入。',
      },
      {
        title: '建立資源',
        content:
          '點擊「建立」按鈕，填寫以下資訊：\n• 訂閱：選擇「免費試用」（新用戶可獲得 $200 美元額度）\n• 區域：選擇「East Asia」（香港）延遲最低\n• 定價層：選擇「Free F0」（每月 5 小時免費語音轉文字）\n• 資源名稱：自訂名稱（例如：aprilvoice-speech）',
      },
      {
        title: '等待部署完成',
        content: '點擊「檢閱 + 建立」，然後「建立」。等待約 1-2 分鐘完成部署。',
      },
      {
        title: '取得金鑰',
        content:
          '部署完成後，點擊「前往資源」。在左側選單找到「金鑰和端點」，複製「金鑰 1」或「金鑰 2」（兩個都可以用）。',
      },
    ],
  },
  google: {
    title: 'Google Cloud Speech',
    icon: '🔴',
    badge: '$300 額度',
    badgeColor: 'bg-blue-500',
    steps: [
      {
        title: '前往 Google Cloud Console',
        content: '開啟瀏覽器，前往 https://console.cloud.google.com',
      },
      {
        title: '註冊並啟用免費試用',
        content:
          '使用 Google 帳號登入。新用戶可獲得 $300 美元免費額度，有效期 90 天。需要綁定信用卡（不會自動扣款）。',
      },
      {
        title: '建立新專案',
        content:
          '點擊頂部的專案選擇器，然後點擊「新增專案」。輸入專案名稱（例如：aprilvoice），點擊「建立」。',
      },
      {
        title: '啟用 Speech-to-Text API',
        content:
          '在搜尋欄輸入「Speech-to-Text API」，點擊進入後按「啟用」按鈕。',
      },
      {
        title: '建立服務帳戶',
        content:
          '前往「IAM 與管理」→「服務帳戶」。點擊「建立服務帳戶」，輸入名稱，角色選擇「Cloud Speech Client」。',
      },
      {
        title: '下載 JSON 金鑰',
        content:
          '點擊剛建立的服務帳戶，進入「金鑰」分頁。點擊「新增金鑰」→「建立新金鑰」→「JSON」。金鑰檔案會自動下載。',
      },
    ],
  },
  openai: {
    title: 'OpenAI Whisper',
    icon: '🟢',
    badge: '$5 額度',
    badgeColor: 'bg-purple-500',
    steps: [
      {
        title: '前往 OpenAI Platform',
        content: '開啟瀏覽器，前往 https://platform.openai.com',
      },
      {
        title: '註冊帳號',
        content:
          '點擊「Sign up」註冊新帳號。可以使用 email 或 Google/Microsoft 帳號。新用戶可獲得 $5 美元免費額度。',
      },
      {
        title: '驗證手機號碼',
        content: '註冊後需要驗證手機號碼。每個手機號碼只能驗證一個帳號。',
      },
      {
        title: '前往 API Keys 頁面',
        content:
          '登入後，點擊右上角頭像，選擇「View API keys」，或直接前往 https://platform.openai.com/api-keys',
      },
      {
        title: '建立 API Key',
        content:
          '點擊「Create new secret key」，可以為金鑰取名（例如：aprilvoice）。',
      },
      {
        title: '複製並保存金鑰',
        content:
          '金鑰只會顯示一次！請立即複製並安全保存。如果遺失需要重新建立。',
      },
    ],
  },
};

const tipsData = [
  {
    platform: 'Azure',
    tip: '用不同 email 多開帳號，每個帳號都有 $200 免費額度',
    difficulty: '簡單',
    difficultyColor: 'text-green-400',
  },
  {
    platform: 'Google',
    tip: '需要不同信用卡，較難多開',
    difficulty: '困難',
    difficultyColor: 'text-red-400',
  },
  {
    platform: 'OpenAI',
    tip: '不同 email + 不同手機號，每個帳號 $5 額度',
    difficulty: '中等',
    difficultyColor: 'text-yellow-400',
  },
];

export function TutorialPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('azure');

  const currentContent = tabContents[activeTab];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">API 申請教學</h1>
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
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">
            AprilVoice 支援多種語音辨識 API。以下是各平台的申請教學，選擇適合你的方案開始使用。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
          {(Object.keys(tabContents) as TabKey[]).map((key) => {
            const tab = tabContents[key];
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === key
                    ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${tab.badgeColor} text-white`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span>{currentContent.icon}</span>
              <span>{currentContent.title}</span>
              <span
                className={`text-sm px-3 py-1 rounded-full ${currentContent.badgeColor} text-white`}
              >
                {currentContent.badge}
              </span>
            </h2>

            <div className="space-y-4">
              {currentContent.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gray-750 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: 'rgb(55, 65, 81)' }}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 whitespace-pre-line">
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>多帳號技巧</span>
          </h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-3 text-left text-gray-200 font-semibold">
                    平台
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200 font-semibold">
                    技巧
                  </th>
                  <th className="px-4 py-3 text-left text-gray-200 font-semibold">
                    難度
                  </th>
                </tr>
              </thead>
              <tbody>
                {tipsData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-700 hover:bg-gray-750 transition-colors"
                    style={{ backgroundColor: index % 2 === 1 ? 'rgb(55, 65, 81)' : undefined }}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {item.platform}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{item.tip}</td>
                    <td className={`px-4 py-3 font-medium ${item.difficultyColor}`}>
                      {item.difficulty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
          <p className="text-yellow-200 text-sm">
            <strong>注意：</strong>
            請遵守各平台的使用條款。濫用免費額度可能導致帳號被封禁。建議正式使用時購買付費方案。
          </p>
        </div>
      </main>
    </div>
  );
}

export default TutorialPage;
