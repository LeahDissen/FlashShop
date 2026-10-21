import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

/** A success or error line under a form ({ type: 'success' | 'error', text }) */
export default function FormMessage({ message }) {
    if (!message.text) return null;
    return (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            {message.text}
        </div>
    );
}
