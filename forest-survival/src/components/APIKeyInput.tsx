import { useState, useEffect } from 'react';
import OpenAI from 'openai';

interface APIKeyInputProps {
  onSubmit: (apiKey: string) => void;
  onSkipAI: () => void;
}

const API_KEY_STORAGE = 'forest_survival_openai_key';

const APIKeyInput = ({ onSubmit, onSkipAI }: APIKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    // Check for stored API key
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    if (storedKey) {
      setApiKey(storedKey);
      setHasStoredKey(true);
    }
  }, []);

  const validateAPIKey = async (key: string): Promise<boolean> => {
    try {
      const openai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      });

      // Send a minimal test request
      await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return true;
    } catch (err: any) {
      console.error('API validation error:', err);
      if (err?.status === 401) {
        setError('Invalid API key. Please check your key and try again.');
      } else if (err?.status === 429) {
        setError('Rate limit exceeded. Please try again in a moment.');
      } else if (err?.code === 'insufficient_quota') {
        setError('API key has insufficient quota. Please add credits to your OpenAI account.');
      } else {
        setError('Failed to validate API key. Check your internet connection.');
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }
    if (!apiKey.startsWith('sk-')) {
      setError('Invalid API key format. Must start with "sk-"');
      return;
    }

    setError('');
    setIsValidating(true);

    // Validate the API key
    const isValid = await validateAPIKey(apiKey.trim());

    setIsValidating(false);

    if (isValid) {
      // Store in localStorage
      localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
      onSubmit(apiKey.trim());
    }
  };

  const handleDeleteKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setHasStoredKey(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8 rounded-3xl shadow-2xl border-2 border-purple-500 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-2">
            AI-Powered Gameplay
          </h2>
          <p className="text-gray-300 text-lg">
            Enter your OpenAI API key to unlock intelligent adaptive gameplay
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-black bg-opacity-50 p-4 rounded-xl border border-cyan-500 mb-6">
          <p className="text-cyan-300 text-sm mb-2">
            🔒 <strong>Your API key is secure:</strong>
          </p>
          <ul className="text-gray-400 text-xs space-y-1 ml-4">
            <li>• Stored in browser localStorage (persistent)</li>
            <li>• Never sent to our servers</li>
            <li>• Direct connection to OpenAI</li>
            <li>• Used only for gameplay generation</li>
            <li>• Can be deleted anytime</li>
          </ul>
        </div>

        {/* Stored Key Notice */}
        {hasStoredKey && (
          <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-xl p-3 mb-4">
            <p className="text-green-300 text-sm flex items-center gap-2">
              ✅ <strong>Stored API key found!</strong>
            </p>
            <p className="text-green-200 text-xs mt-1">
              Your previously saved key will be used. You can update or delete it below.
            </p>
          </div>
        )}

        {/* API Key Input */}
        <div className="mb-4">
          <label className="block text-white text-sm font-semibold mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isValidating && handleSubmit()}
              placeholder="sk-..."
              disabled={isValidating}
              className="w-full bg-gray-800 text-white px-4 py-3 pr-24 rounded-xl border-2 border-gray-600 focus:border-purple-500 focus:outline-none transition-all font-mono disabled:opacity-50"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
              {hasStoredKey && (
                <button
                  onClick={handleDeleteKey}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete stored key"
                >
                  🗑️
                </button>
              )}
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
              ⚠️ {error}
            </p>
          )}
          {isValidating && (
            <p className="text-cyan-400 text-sm mt-2 flex items-center gap-2">
              <span className="inline-block animate-spin">⏳</span> Validating API key...
            </p>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-xl p-3 mb-6">
          <p className="text-yellow-200 text-xs">
            💡 <strong>Don't have an API key?</strong> Get one at{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-400 transition-colors"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isValidating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isValidating ? '⏳ Validating...' : '🚀 Continue with AI Mode'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900 text-gray-400">OR</span>
            </div>
          </div>

          <button
            onClick={onSkipAI}
            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            🎮 Play Without AI (Classic Mode)
          </button>
        </div>

        {/* Features Preview */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-black bg-opacity-30 p-3 rounded-lg text-center">
            <div className="text-2xl mb-1">🎮</div>
            <p className="text-white text-xs font-semibold">Dynamic Gameplay</p>
            <p className="text-gray-400 text-[10px]">AI adapts to your prompts</p>
          </div>
          <div className="bg-black bg-opacity-30 p-3 rounded-lg text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-white text-xs font-semibold">Smart Enemies</p>
            <p className="text-gray-400 text-[10px]">Intelligent spawn control</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeyInput;
