import { useEffect, useState } from 'react';
import { FaBox, FaCheckCircle, FaClock, FaTruck, FaUserCircle } from 'react-icons/fa';
import { fetchUserInfo } from '../api/auth';
import { getUserOrders } from '../api/orders';
import useAuthStore from '../store/authStore';

export default function ProfilePage() {
    const [userInfo, setUserInfo] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = useAuthStore(state => state.userId);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userRes = await fetchUserInfo();
                setUserInfo(userRes.data);
                if (userId) {
                    const ordersData = await getUserOrders(userId);
                    ordersData.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
                    setOrders(ordersData);
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadData();
        }
    }, [userId]);

    const getStatusBadge = (status) => {
        const styles = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'ממתין', icon: <FaClock /> },
            processing: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'בטיפול', icon: <FaClock /> },
            shipped: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'נשלח', icon: <FaTruck /> },
            delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'נמסר', icon: <FaCheckCircle /> },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'בוטל', icon: <FaCheckCircle /> },
        };
        const s = styles[status] || styles.pending;
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${s.bg} ${s.text}`}>
                {s.icon} {s.label}
            </span>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">טוען...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* User Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="bg-red-50 p-4 rounded-full">
                        <FaUserCircle className="text-6xl text-[#f2665e]" />
                    </div>
                    <div className="text-center md:text-right flex-1">
                        <h1 className="text-3xl font-bold text-gray-800">{userInfo?.name || 'משתמש'}</h1>
                        <p className="text-gray-500 mt-1 text-lg">{userInfo?.email}</p>
                        <div className="mt-4 flex gap-3 justify-center md:justify-start">
                            <span className="bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-sm font-medium">
                                {orders.length} הזמנות
                            </span>
                            {userInfo?.role === 'admin' && (
                                <span className="bg-[#f2665e]/10 text-[#f2665e] px-4 py-1 rounded-full text-sm font-bold">
                                    מנהל מערכת
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Orders Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FaBox className="text-[#f2665e]" />
                        ההזמנות שלי
                    </h2>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
                            <p className="text-gray-500 text-lg">עדיין לא ביצעת הזמנות.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Order Header */}
                                    <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                        <div className="flex gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 block">תאריך הזמנה</span>
                                                <span className="font-medium">
                                                    {new Date(order.date_created).toLocaleDateString('he-IL')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">מספר הזמנה</span>
                                                <span className="font-mono">{order._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">סה"כ לתשלום</span>
                                                <span className="font-bold text-[#f2665e]">₪{order.total_price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {getStatusBadge(order.status)}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-4">
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    {item.image && (
                                                        <img 
                                                            src={item.image} 
                                                            alt={item.name} 
                                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                                        <div className="text-sm text-gray-500 flex gap-3">
                                                            <span>כמות: {item.quantity}</span>
                                                            <span>|</span>
                                                            <span>מחיר: ₪{item.price}</span>
                                                            {item.size && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span>גודל: {item.size}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}