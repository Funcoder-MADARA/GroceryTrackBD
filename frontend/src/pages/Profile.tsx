import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Mail, Phone, MapPin, Building, User, Briefcase, CreditCard, Landmark, KeyRound, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const fieldIcons: Record<string, React.ReactNode> = {
  'companyName': <Building className="h-4 w-4 text-primary-500 mr-2" />,
  'companyType': <Briefcase className="h-4 w-4 text-primary-500 mr-2" />,
  'businessLicense': <CreditCard className="h-4 w-4 text-primary-500 mr-2" />,
  'taxId': <Landmark className="h-4 w-4 text-primary-500 mr-2" />,
  'shopName': <Building className="h-4 w-4 text-primary-500 mr-2" />,
  'businessType': <Briefcase className="h-4 w-4 text-primary-500 mr-2" />,
  'businessHours': <KeyRound className="h-4 w-4 text-primary-500 mr-2" />,
  'shopSize': <Landmark className="h-4 w-4 text-primary-500 mr-2" />,
  'vehicleType': <Truck className="h-4 w-4 text-primary-500 mr-2" />,
  'vehicleNumber': <CreditCard className="h-4 w-4 text-primary-500 mr-2" />,
  'availability': <KeyRound className="h-4 w-4 text-primary-500 mr-2" />,
  'email': <Mail className="h-4 w-4 text-primary-500 mr-2" />,
  'phone': <Phone className="h-4 w-4 text-primary-500 mr-2" />,
  'area': <MapPin className="h-4 w-4 text-primary-500 mr-2" />,
  'city': <MapPin className="h-4 w-4 text-primary-500 mr-2" />,
  'address': <MapPin className="h-4 w-4 text-primary-500 mr-2" />,
  'name': <User className="h-4 w-4 text-primary-500 mr-2" />,
};

const Profile: React.FC = () => {
  const { user, updateProfile, updateProfileImage } = useAuth();
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!user) return <div>Loading...</div>;

  // Helper to render an editable field
  const renderField = (label: string, value: string, fieldKey: string, nestedKey?: string) => (
    <div className="flex items-center mb-4 transition-all duration-300 group">
      <div className="w-48 font-medium text-gray-700 flex items-center">
        {fieldIcons[fieldKey]}
        {label}:
      </div>
      {editField === fieldKey ? (
        <>
          <input
            className="input mr-2 border-primary-300 focus:border-primary-500 transition-all duration-200 shadow-sm"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            disabled={isSaving}
            autoFocus
          />
          <button
            className="btn btn-primary btn-sm mr-2 scale-100 hover:scale-105 transition-transform duration-150"
            disabled={isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                let updateData: any = {};
                if (nestedKey) {
                  updateData[nestedKey] = { ...(user as any)[nestedKey], [fieldKey]: editValue };
                } else {
                  updateData[fieldKey] = editValue;
                }
                await updateProfile(updateData);
                toast.success('Profile updated!');
                setEditField(null);
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Failed to update profile');
              } finally {
                setIsSaving(false);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditField(null)} disabled={isSaving}>Cancel</button>
        </>
      ) : (
        <>
          <span className="mr-2 transition-colors duration-200 group-hover:text-primary-700">{value || <span className="text-gray-400">(empty)</span>}</span>
          <button className="btn btn-ghost btn-sm opacity-70 hover:opacity-100 transition-opacity duration-200" onClick={() => { setEditField(fieldKey); setEditValue(value || ''); }}>
            <Pencil className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  // Profile image upload handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await updateProfileImage(base64);
          toast.success('Profile picture updated!');
        } catch (err: any) {
          toast.error(err?.response?.data?.message || 'Failed to update profile picture');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to read image file');
      setIsUploading(false);
    }
  };

  // Profile image
  const renderProfileImage = () => (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group">
        <img
          src={user.profileImage || '/default-profile.png'}
          alt="Profile"
          className="h-32 w-32 rounded-full object-cover border-4 border-primary-100 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
          style={{ aspectRatio: '1/1' }}
        />
        <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer opacity-80 hover:opacity-100 transition-opacity duration-200 border border-primary-200">
          <Pencil className="h-4 w-4 text-primary-600" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isUploading}
          />
        </label>
      </div>
      <span className="text-xs text-gray-500 mt-2">{isUploading ? 'Uploading...' : 'Change Photo'}</span>
    </div>
  );

  // Card wrapper
  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto animate-fade-in mt-10 border border-gray-100">
      {children}
    </div>
  );

  // Company Account
  if (user.role === 'company_rep' && user.companyInfo) {
    return (
      <Card>
        <h2 className="text-3xl font-bold mb-8 text-primary-700 tracking-tight animate-slide-down">Company Profile</h2>
        {renderProfileImage()}
        <div className="space-y-2">
          {renderField('Company Name', user.companyInfo.companyName, 'companyName', 'companyInfo')}
          {renderField('Company Type', user.companyInfo.companyType, 'companyType', 'companyInfo')}
          {renderField('Business License', user.companyInfo.businessLicense, 'businessLicense', 'companyInfo')}
          {renderField('Tax ID', user.companyInfo.taxId, 'taxId', 'companyInfo')}
          {renderField('Email', user.email, 'email')}
          {renderField('Phone', user.phone, 'phone')}
          {renderField('Area', user.area, 'area')}
          {renderField('City', user.city, 'city')}
          {renderField('Address', user.address, 'address')}
        </div>
      </Card>
    );
  }

  // Shopkeeper Account
  if (user.role === 'shopkeeper' && user.shopkeeperInfo) {
    return (
      <Card>
        <h2 className="text-3xl font-bold mb-8 text-primary-700 tracking-tight animate-slide-down">Shopkeeper Profile</h2>
        {renderProfileImage()}
        <div className="space-y-2">
          {renderField('Shop Name', user.shopkeeperInfo.shopName, 'shopName', 'shopkeeperInfo')}
          {renderField('Business Type', user.shopkeeperInfo.businessType, 'businessType', 'shopkeeperInfo')}
          {renderField('Business Hours', user.shopkeeperInfo.businessHours, 'businessHours', 'shopkeeperInfo')}
          {renderField('Shop Size', user.shopkeeperInfo.shopSize, 'shopSize', 'shopkeeperInfo')}
          {renderField('Email', user.email, 'email')}
          {renderField('Phone', user.phone, 'phone')}
          {renderField('Area', user.area, 'area')}
          {renderField('City', user.city, 'city')}
          {renderField('Address', user.address, 'address')}
        </div>
      </Card>
    );
  }

  // Delivery Worker Account
  if (user.role === 'delivery_worker' && user.deliveryWorkerInfo) {
    return (
      <Card>
        <h2 className="text-3xl font-bold mb-8 text-primary-700 tracking-tight animate-slide-down">Delivery Worker Profile</h2>
        {renderProfileImage()}
        <div className="space-y-2">
          {renderField('Full Name', user.name, 'name')}
          {renderField('Vehicle Type', user.deliveryWorkerInfo.vehicleType, 'vehicleType', 'deliveryWorkerInfo')}
          {renderField('Vehicle Number', user.deliveryWorkerInfo.vehicleNumber, 'vehicleNumber', 'deliveryWorkerInfo')}
          {renderField('Availability', user.deliveryWorkerInfo.availability, 'availability', 'deliveryWorkerInfo')}
          {renderField('Email', user.email, 'email')}
          {renderField('Phone', user.phone, 'phone')}
          {renderField('Area', user.area, 'area')}
          {renderField('City', user.city, 'city')}
          {renderField('Address', user.address, 'address')}
        </div>
      </Card>
    );
  }

  // Fallback for admin or unknown role
  return (
    <Card>
      <h2 className="text-3xl font-bold mb-8 text-primary-700 tracking-tight animate-slide-down">Profile</h2>
      {renderProfileImage()}
      <div className="space-y-2">
        {renderField('Full Name', user.name, 'name')}
        {renderField('Email', user.email, 'email')}
        {renderField('Phone', user.phone, 'phone')}
        {renderField('Role', user.role, 'role')}
        {renderField('Area', user.area, 'area')}
        {renderField('City', user.city, 'city')}
        {renderField('Address', user.address, 'address')}
      </div>
    </Card>
  );
};

// Animations (Tailwind CSS or add to your global CSS)
// .animate-fade-in { animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1) both; }
// .animate-slide-down { animation: slideDown 0.7s cubic-bezier(.4,0,.2,1) both; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideDown { from { opacity: 0; transform: translateY(-20px);} to { opacity: 1; transform: none; } }

export default Profile; 