import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { productsAPI, flagsAPI } from '../services/api';

interface FlagFormData {
  companyId: string;
  productId: string;
  quantityBought: number;
  date: string;
  quantitySold: number;
  receipt: FileList;
  rating: number;
  remarks: string;
}

interface Company {
  _id: string;
  name: string;
  email: string;
  companyInfo: { companyName: string };
}

interface Product {
  _id: string;
  name: string;
  companyId?: any;
  companyID?: string;
}

interface PersistedFlag {
  _id: string;
  companyId: { _id: string; companyInfo?: { companyName?: string } } | string;
  productId: { _id: string; name?: string } | string;
  quantityBought: number;
  quantitySold: number;
  date: string;
  receiptPath?: string | null;
  rating: number;
  remarks?: string;
}

const Flags: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [flags, setFlags] = useState<PersistedFlag[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [quantityRemaining, setQuantityRemaining] = useState<number | null>(null);
  const [lossPercent, setLossPercent] = useState<number | null>(null);

  const { register, handleSubmit, watch, control, reset, setValue, formState: { errors } } = useForm<FlagFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Normalize company id from various shapes in products
  const getCompanyIdFromProduct = (p: any): string => {
    const cid = p?.companyID ?? p?.companyId;
    if (!cid) return '';
    if (typeof cid === 'string') return cid;
    if (typeof cid === 'object') {
      if (cid.$oid) return String(cid.$oid);
      if (cid._id) return String(cid._id);
      if (cid.id) return String(cid.id);
      // When populated, cid may itself be the id string
      return String(cid);
    }
    return '';
  };

  // Fetch companies (derived from products) and my flags on mount
  useEffect(() => {
    const fetchCompaniesFromProducts = async () => {
      const uniqueCompanies = new Map<string, Company>();
      let page = 1;
      const limit = 100;
      // Loop through pages until no next page
      // Backend caps limit at 100
      // Stop if pagination is missing to avoid infinite loop
      while (true) {
        const res = await productsAPI.getProducts({ page, limit });
        const data = res.data;
        const productList = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.products) ? data.products : []);
        for (const p of productList) {
          const id = getCompanyIdFromProduct(p);
          if (!id) continue;

          let companyName = 'Company';
          const populatedCompany = p?.companyId;
          if (populatedCompany && typeof populatedCompany === 'object' && (populatedCompany.name || populatedCompany.companyInfo)) {
            companyName = (populatedCompany.companyInfo && populatedCompany.companyInfo.companyName) || populatedCompany.name || 'Company';
          }

          if (!uniqueCompanies.has(id)) {
            uniqueCompanies.set(id, {
              _id: id,
              name: companyName,
              email: '',
              companyInfo: { companyName: companyName || `Company ${id.slice(0,6)}` }
            });
          }
        }
        const pagination = data && data.pagination;
        if (!pagination || !pagination.hasNextPage) break;
        page += 1;
      }
      // Store all fetched products for client-side filtering by companyID/companyId
      setAllProducts(prev => {
        // Avoid duplicates by _id
        const byId = new Map<string, Product>();
        for (const p of prev.concat([])) byId.set(p._id, p);
        // Add latest page results
        // We refetch above in pages; to keep it simple, just return unique set collected from uniqueCompanies loop
        // Instead, re-fetch a combined list in a second pass
        return prev; // will set after loop below
      });
      setCompanies(Array.from(uniqueCompanies.values()));
    };

    fetchCompaniesFromProducts().catch(() => setCompanies([]));
    flagsAPI.getMyFlags().then(res => setFlags(res.data || [])).catch(() => setFlags([]));
  }, []);

  // Fetch and store all products for client-side filtering by company
  useEffect(() => {
    const fetchAllProducts = async () => {
      let page = 1;
      const limit = 100;
      const collected: Product[] = [];
      while (true) {
        const res = await productsAPI.getProducts({ page, limit });
        const data = res.data;
        const productList: Product[] = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.products) ? data.products : []);
        collected.push(...productList);
        const pagination = data && data.pagination;
        if (!pagination || !pagination.hasNextPage) break;
        page += 1;
      }
      // Deduplicate by _id
      const map = new Map<string, Product>();
      for (const p of collected) map.set(p._id, p);
      setAllProducts(Array.from(map.values()));
    };
    fetchAllProducts().catch(() => setAllProducts([]));
  }, []);

  // Fetch products when company changes
  const selectedCompanyId = watch('companyId');
  useEffect(() => {
    if (selectedCompanyId) {
      const filtered = allProducts.filter((p: any) => getCompanyIdFromProduct(p) === String(selectedCompanyId));
      if (filtered.length > 0) {
        setProducts(filtered);
      } else {
        // Fallback: fetch from API using companyId param
        productsAPI.getProducts({ companyId: selectedCompanyId }).then(res => {
          const data = Array.isArray(res.data)
            ? res.data
            : (res.data && Array.isArray(res.data.products) ? res.data.products : []);
          setProducts(data);
        }).catch(() => setProducts([]));
      }
    } else {
      setProducts([]);
    }
    setValue('productId', '');
  }, [selectedCompanyId, setValue, allProducts]);

  // Clear company search when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      const selectedCompany = companies.find(c => c._id === selectedCompanyId);
      if (selectedCompany) {
        setCompanySearch(selectedCompany.companyInfo?.companyName || selectedCompany.name);
      }
    }
  }, [selectedCompanyId, companies]);

  // Watch for quantity changes
  const quantityBought = watch('quantityBought') || 0;
  const quantitySold = watch('quantitySold') || 0;
  const selectedDate = watch('date');
  
  useEffect(() => {
    if (quantityBought >= 0 && quantitySold >= 0) {
      const remaining = quantityBought - quantitySold;
      setQuantityRemaining(remaining);
      
      // Calculate base loss percentage (what percentage of bought quantity was NOT sold)
      const baseLossPercent = quantityBought > 0 ? ((quantityBought - quantitySold) / quantityBought) * 100 : 0;
      
      // Calculate time-based additional loss
      let timeBasedLoss = 0;
      if (selectedDate) {
        const orderDate = new Date(selectedDate);
        const currentDate = new Date();
        const monthsDifference = (currentDate.getFullYear() - orderDate.getFullYear()) * 12 + 
                               (currentDate.getMonth() - orderDate.getMonth());
        
        // Add 2% loss for each month after 6 months
        if (monthsDifference > 6) {
          timeBasedLoss = (monthsDifference - 6) * 2;
        }
      }
      
      // Total loss percentage (base loss + time-based loss, capped at 100%)
      const totalLossPercent = Math.min(100, baseLossPercent + timeBasedLoss);
      
      setLossPercent(totalLossPercent);
    }
  }, [quantityBought, quantitySold, selectedDate]);

  // Filter companies by search
  const filteredCompanies = companies.filter(c =>
    c.companyInfo?.companyName?.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const onSubmit = async (data: FlagFormData) => {
    const formData = new FormData();
    formData.append('companyId', data.companyId);
    formData.append('productId', data.productId);
    formData.append('quantityBought', String(data.quantityBought));
    formData.append('quantitySold', String(data.quantitySold));
    formData.append('date', data.date);
    formData.append('rating', String(data.rating));
    formData.append('remarks', data.remarks || '');
    if (data.receipt && data.receipt[0]) {
      formData.append('receipt', data.receipt[0]);
    }
    await flagsAPI.createFlag(formData);
    const refreshed = await flagsAPI.getMyFlags();
    setFlags(refreshed.data || []);
    reset({ date: new Date().toISOString().split('T')[0] } as any);
    setCompanySearch('');
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Flags</h1>
      <button
        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        onClick={() => setShowForm(true)}
      >
        Add Flag
      </button>
      {showForm && (
        <form
          className="mt-6 p-4 border rounded bg-gray-50 space-y-4 max-w-xl"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Company Searchable Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Select Company</label>
            <div className="relative">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Search and select company..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                onFocus={() => setShowCompanyDropdown(true)}
                onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
              />
              {showCompanyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map(company => (
                      <div
                        key={company._id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setValue('companyId', company._id);
                          setCompanySearch(company.companyInfo?.companyName || company.name);
                          setShowCompanyDropdown(false);
                        }}
                      >
                        <div className="font-medium">{company.companyInfo?.companyName || company.name}</div>
                        <div className="text-sm text-gray-500">{company.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">No companies found</div>
                  )}
                </div>
              )}
            </div>
            {errors.companyId && <span className="text-red-500 text-xs">{errors.companyId.message}</span>}
          </div>

          {/* Product Dropdown filtered by company */}
          <div>
            <label className="block text-sm font-medium mb-1">Select Product</label>
            <select
              className="input input-bordered w-full"
              {...register('productId', { required: 'Product is required' })}
              disabled={!selectedCompanyId}
            >
              <option value="">{selectedCompanyId ? 'Select a product' : 'Select a company first'}</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>{product.name}</option>
              ))}
            </select>
            {errors.productId && <span className="text-red-500 text-xs">{errors.productId.message}</span>}
          </div>

          {/* Quantity Bought */}
          <div>
            <label className="block text-sm font-medium mb-1">Enter Quantity Bought</label>
            <input
              type="number"
              className="input input-bordered w-full"
              min={0}
              {...register('quantityBought', { required: 'Quantity bought is required', min: 0 })}
            />
            {errors.quantityBought && <span className="text-red-500 text-xs">{errors.quantityBought.message}</span>}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">Enter Date</label>
            <input
              type="date"
              className="input input-bordered w-full"
              {...register('date', { required: 'Date is required' })}
            />
            {errors.date && <span className="text-red-500 text-xs">{errors.date.message}</span>}
          </div>

          {/* Quantity Sold */}
          <div>
            <label className="block text-sm font-medium mb-1">Enter Quantity Sold</label>
            <input
              type="number"
              className="input input-bordered w-full"
              min={0}
              {...register('quantitySold', { required: 'Quantity sold is required', min: 0 })}
            />
            {errors.quantitySold && <span className="text-red-500 text-xs">{errors.quantitySold.message}</span>}
          </div>

                     {/* Calculated Fields */}
           <div className="space-y-3">
             <div className="flex space-x-4">
               <div>
                 <label className="block text-xs font-medium">Quantity Remaining</label>
                 <div className="font-semibold">{quantityRemaining !== null ? quantityRemaining : '-'}</div>
               </div>
               <div>
                 <label className="block text-xs font-medium">Total % Loss</label>
                 <div className="font-semibold text-red-600">{lossPercent !== null ? `${lossPercent.toFixed(2)}%` : '-'}</div>
               </div>
             </div>
             
             {/* Loss Breakdown */}
             {selectedDate && quantityBought > 0 && (
               <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                 <div className="font-medium mb-1">Loss Breakdown:</div>
                 <div>• Base Loss: {quantityBought > 0 ? (((quantityBought - quantitySold) / quantityBought) * 100).toFixed(2) : '0'}% (unsold inventory)</div>
                 {(() => {
                   const orderDate = new Date(selectedDate);
                   const currentDate = new Date();
                   const monthsDifference = (currentDate.getFullYear() - orderDate.getFullYear()) * 12 + 
                                          (currentDate.getMonth() - orderDate.getMonth());
                   if (monthsDifference > 6) {
                     const timeBasedLoss = (monthsDifference - 6) * 2;
                     return <div>• Time-based Loss: +{timeBasedLoss.toFixed(2)}% (after 6 months, +2% per month)</div>;
                   }
                   return null;
                 })()}
               </div>
             )}
           </div>

          {/* PDF Receipt Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Receipt (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              className="input input-bordered w-full"
              {...register('receipt', { required: 'Receipt is required' })}
            />
            {errors.receipt && <span className="text-red-500 text-xs">{errors.receipt.message}</span>}
          </div>

          {/* 5-Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <Controller
              control={control}
              name="rating"
              rules={{ required: 'Rating is required' }}
              render={({ field }) => (
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={
                        'text-2xl ' +
                        (field.value && field.value >= star
                          ? 'text-yellow-400'
                          : 'text-gray-300')
                      }
                      onClick={() => field.onChange(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.rating && <span className="text-red-500 text-xs">{errors.rating.message}</span>}
          </div>

          {/* Additional Remarks */}
          <div>
            <label className="block text-sm font-medium mb-1">Additional Remarks</label>
            <textarea
              className="input input-bordered w-full"
              rows={3}
              {...register('remarks')}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Submit
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => { 
                setShowForm(false); 
                reset({ date: new Date().toISOString().split('T')[0] } as any); 
                setCompanySearch('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List of Submitted Flags */}
      {flags.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Submitted Flags</h2>
          <div className="space-y-4">
            {flags.map((flag) => {
              const companyName = typeof flag.companyId === 'object' ? flag.companyId.companyInfo?.companyName : '';
              const productName = typeof flag.productId === 'object' ? flag.productId.name : '';
              return (
                <div key={flag._id} className="p-4 border rounded bg-white">
                  <div className="font-bold">{companyName || 'Company'}</div>
                  <div>Product: {productName || 'Product'}</div>
                                     <div>Quantity Bought: {flag.quantityBought}</div>
                   <div>Date: {new Date(flag.date).toLocaleDateString()}</div>
                   <div>Quantity Sold: {flag.quantitySold}</div>
                   <div>Quantity Remaining: {flag.quantityBought - flag.quantitySold}</div>
                   <div>Loss %: {(() => {
                     const baseLoss = flag.quantityBought > 0 ? ((flag.quantityBought - flag.quantitySold) / flag.quantityBought) * 100 : 0;
                     const orderDate = new Date(flag.date);
                     const currentDate = new Date();
                     const monthsDifference = (currentDate.getFullYear() - orderDate.getFullYear()) * 12 + 
                                            (currentDate.getMonth() - orderDate.getMonth());
                     let timeBasedLoss = 0;
                     if (monthsDifference > 6) {
                       timeBasedLoss = (monthsDifference - 6) * 2;
                     }
                     const totalLoss = Math.min(100, baseLoss + timeBasedLoss);
                     return `${totalLoss.toFixed(2)}%`;
                   })()}</div>
                  <div>Rating: {'★'.repeat(flag.rating)}{'☆'.repeat(5 - flag.rating)}</div>
                  {flag.receiptPath && (
                    <div>
                      Receipt: <a className="text-primary-600 underline" href={flag.receiptPath} target="_blank" rel="noreferrer">View PDF</a>
                    </div>
                  )}
                  {flag.remarks && <div>Remarks: {flag.remarks}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Flags;
