import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Plus, Edit, Trash2, Library, X, Search, 
  Upload, Sparkles, BookMarked, Layers, UserCheck, Download 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import * as XLSX from 'xlsx';

export const BookManagement: React.FC = () => {
  const { showToast } = useToast();
  
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  
  // Category / Author quick add state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      subtitle: '',
      authors: '',
      categories: '',
      isbn: '',
      description: '',
      totalCopies: 1,
      isEbook: false,
      isAudiobook: false,
      condition: 'New',
      difficulty: 'Easy',
      estimatedReadingTimeMinutes: 120,
      programmingLevel: 'None',
      mathematicsLevel: 'None',
      careerRelevance: '',
      requiredKnowledge: '',
    }
  });

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/books', { params: { page: 1, limit: 1000 } });
      if (res.data.success) {
        const allBooks = res.data.books;
        
        const rows = allBooks.map((b: any) => ({
          Title: b.title,
          Subtitle: b.subtitle || '',
          ISBN: b.isbn,
          Authors: b.authors.map((a: any) => a.name).join(', '),
          Categories: b.categories.map((c: any) => c.name).join(', '),
          TotalCopies: b.totalCopies,
          CopiesAvailable: b.copiesAvailable,
          Rating: b.rating || 0,
          Description: b.description || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Books Catalog');

        XLSX.writeFile(workbook, 'Smart_Library_Books_Catalog.xlsx');
        showToast('Books catalog exported successfully to Excel', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to export catalog to Excel', 'error');
    }
  };

  const triggerExcelImport = () => {
    document.getElementById('excel-import-file')?.click();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);
        
        if (json.length === 0) {
          showToast('No books found in the spreadsheet', 'error');
          return;
        }

        let successCount = 0;
        let failCount = 0;
        
        setLoading(true);
        for (const row of json) {
          try {
            const payload = {
              title: row.Title || row.title,
              subtitle: row.Subtitle || row.subtitle || '',
              isbn: row.ISBN || row.isbn || Date.now().toString(),
              authors: (row.Authors || row.authors || 'Unknown Author').split(',').map((s: string) => s.trim()),
              categories: (row.Categories || row.categories || 'General').split(',').map((s: string) => s.trim()),
              totalCopies: parseInt(row.TotalCopies || row.totalcopies || '1') || 1,
              description: row.Description || row.description || `Catalog entry for ${row.Title || 'Book'}.`,
            };
            
            const formData = new FormData();
            formData.append('title', payload.title);
            formData.append('subtitle', payload.subtitle);
            formData.append('isbn', payload.isbn.toString());
            formData.append('authors', JSON.stringify(payload.authors));
            formData.append('categories', JSON.stringify(payload.categories));
            formData.append('totalCopies', payload.totalCopies.toString());
            formData.append('description', payload.description);

            await api.post('/books', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            successCount++;
          } catch (err) {
            console.error('Row insert failed:', err);
            failCount++;
          }
        }

        showToast(`Import completed: ${successCount} added, ${failCount} failed.`, 'info');
        loadBooks(1);
      } catch (error) {
        console.error(error);
        showToast('Error reading Excel spreadsheet file', 'error');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const loadBooks = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/books', {
        params: { page: targetPage, limit: 8, search: searchQuery.trim() }
      });
      if (res.data.success) {
        setBooks(res.data.books);
        setTotalPages(res.data.pages || 1);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      showToast('Error loading books catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBooks(1);
    loadCategories();
  }, [searchQuery]);

  const handleOpenAddModal = () => {
    setEditBookId(null);
    setCoverImage(null);
    setCoverPreview(null);
    setPdfFile(null);
    setPdfName(null);
    setAudioFile(null);
    setAudioName(null);
    reset({
      title: '',
      subtitle: '',
      authors: '',
      categories: '',
      isbn: '',
      description: '',
      totalCopies: 1,
      isEbook: false,
      isAudiobook: false,
      condition: 'New',
      difficulty: 'Easy',
      estimatedReadingTimeMinutes: 120,
      programmingLevel: 'None',
      mathematicsLevel: 'None',
      careerRelevance: '',
      requiredKnowledge: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: any) => {
    setEditBookId(book._id);
    setCoverImage(null);
    setCoverPreview(book.coverImage ? (book.coverImage.startsWith('http') ? book.coverImage : `http://localhost:5000${book.coverImage}`) : null);
    setPdfFile(null);
    setPdfName(book.pdfUrl ? 'Existing PDF E-Book' : null);
    setAudioFile(null);
    setAudioName(book.audioUrl ? 'Existing Audiobook Audio' : null);
    
    // Map array of sub-objects to comma-separated strings
    const authorNames = book.authors.map((a: any) => a.name).join(', ');
    const categoryNames = book.categories.map((c: any) => c.name).join(', ');

    reset({
      title: book.title,
      subtitle: book.subtitle || '',
      authors: authorNames,
      categories: categoryNames,
      isbn: book.isbn,
      description: book.description,
      totalCopies: book.totalCopies,
      isEbook: book.isEbook || false,
      isAudiobook: book.isAudiobook || false,
      condition: book.condition || 'New',
      difficulty: book.difficulty || 'Easy',
      estimatedReadingTimeMinutes: book.estimatedReadingTimeMinutes || 120,
      programmingLevel: book.programmingLevel || 'None',
      mathematicsLevel: book.mathematicsLevel || 'None',
      careerRelevance: book.careerRelevance || '',
      requiredKnowledge: book.requiredKnowledge ? book.requiredKnowledge.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setPdfName(file.name);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioName(file.name);
    }
  };

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.subtitle) formData.append('subtitle', data.subtitle);
    formData.append('isbn', data.isbn);
    formData.append('description', data.description);
    formData.append('totalCopies', data.totalCopies.toString());
    formData.append('isEbook', data.isEbook.toString());
    formData.append('isAudiobook', data.isAudiobook.toString());
    formData.append('condition', data.condition);
    formData.append('difficulty', data.difficulty);
    formData.append('estimatedReadingTimeMinutes', data.estimatedReadingTimeMinutes.toString());
    formData.append('programmingLevel', data.programmingLevel);
    formData.append('mathematicsLevel', data.mathematicsLevel);
    formData.append('careerRelevance', data.careerRelevance || '');
    formData.append('requiredKnowledge', data.requiredKnowledge || '');

    // Convert comma-separated strings into parsed arrays of strings
    const parsedAuthors = data.authors.split(',').map((s: string) => s.trim()).filter(Boolean);
    const parsedCategories = data.categories.split(',').map((s: string) => s.trim()).filter(Boolean);
    formData.append('authors', JSON.stringify(parsedAuthors));
    formData.append('categories', JSON.stringify(parsedCategories));

    if (coverImage) {
      formData.append('coverImage', coverImage);
    }
    if (pdfFile) {
      formData.append('pdfFile', pdfFile);
    }
    if (audioFile) {
      formData.append('audioFile', audioFile);
    }

    setLoading(true);
    try {
      if (editBookId) {
        // Edit PUT API call
        const res = await api.put(`/books/${editBookId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('Book updated successfully', 'success');
          setIsModalOpen(false);
          loadBooks(page);
        }
      } else {
        // Create POST API call
        const res = await api.post('/books', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          showToast('Book created successfully with AI description analysis!', 'success');
          setIsModalOpen(false);
          loadBooks(1);
        }
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to save book catalog details';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book from the catalog permanently?')) return;
    setLoading(true);
    try {
      const res = await api.delete(`/books/${bookId}`);
      if (res.data.success) {
        showToast('Book deleted from catalog', 'success');
        loadBooks(page);
      }
    } catch (err) {
      showToast('Could not delete book from catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await api.post('/categories', { name: newCategoryName.trim() });
      if (res.data.success) {
        showToast('Category created successfully', 'success');
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
        loadCategories();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not create category';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Book Catalog Management</h2>
          <p className="text-xs text-slate-400 mt-1">Manage library records, categories, and inventory shares</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            id="excel-import-file"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            onClick={handleExportExcel}
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
            title="Export full catalog to Excel"
          >
            <Download className="w-4 h-4" />
            Export Catalog
          </button>
          <button
            onClick={triggerExcelImport}
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
            title="Import books from Excel spreadsheet"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Add Genre/Category
          </button>
          <button
            onClick={handleOpenAddModal}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Book
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter catalog by title or isbn..."
          className="form-input pl-10 text-xs"
        />
      </div>

      {/* Books Table grid */}
      {loading && books.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] text-slate-400">Syncing catalog index...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {books.length === 0 ? (
            <div className="glass-card py-16 text-center text-slate-400 rounded-3xl">
              <Library className="w-12 h-12 mx-auto opacity-20 mb-3" />
              <h3 className="font-bold text-slate-705 text-sm">Catalog is empty</h3>
              <p className="text-xs mt-1">Click "Add New Book" to begin building the smart library index.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/50 dark:border-slate-900 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-205 dark:border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Title / Info</th>
                    <th className="p-4">ISBN</th>
                    <th className="p-4">Authors</th>
                    <th className="p-4">Categories</th>
                    <th className="p-4">Stock (Avail/Total)</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {books.map((book) => (
                    <tr key={book._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 rounded-lg overflow-hidden shrink-0 border border-slate-200/20">
                            {book.coverImage && (
                              <img 
                                src={book.coverImage.startsWith('http') ? book.coverImage : `http://localhost:5000${book.coverImage}`} 
                                alt={book.title} 
                                className="w-full h-full object-cover" 
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{book.title}</h4>
                            <span className="text-[10px] text-slate-450 mt-0.5 block">{book.subtitle || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-600 dark:text-slate-350">{book.isbn}</td>
                      <td className="p-4 text-slate-650 dark:text-slate-300 truncate max-w-[150px]">{book.authors.map((a: any) => a.name).join(', ')}</td>
                      <td className="p-4 text-slate-650 dark:text-slate-300 truncate max-w-[150px]">{book.categories.map((c: any) => c.name).join(', ')}</td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-250">{book.copiesAvailable} / {book.totalCopies}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(book)}
                            className="p-2 rounded-xl text-slate-450 hover:text-brand-600 hover:bg-brand-500/10 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book._id)}
                            className="p-2 rounded-xl text-slate-450 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => loadBooks(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => loadBooks(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== ADD/EDIT BOOK MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/65 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="glass-card w-full max-w-2xl p-6 md:p-8 rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto page-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-brand-600" />
                {editBookId ? 'Edit Catalog Entry' : 'Add New Book to Catalog'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Book Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Book Title
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Book title is required' })}
                    className="form-input"
                  />
                  {errors.title && <p className="text-[10px] text-rose-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Book Subtitle */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Subtitle (Optional)
                  </label>
                  <input type="text" {...register('subtitle')} className="form-input" />
                </div>

                {/* ISBN */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    ISBN Code
                  </label>
                  <input
                    type="text"
                    {...register('isbn', { required: 'ISBN code is required' })}
                    className="form-input"
                  />
                  {errors.isbn && <p className="text-[10px] text-rose-500 mt-1">{errors.isbn.message}</p>}
                </div>

                {/* Authors */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Authors (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stephen King, J.K. Rowling"
                    {...register('authors', { required: 'Authors lists are required' })}
                    className="form-input"
                  />
                  {errors.authors && <p className="text-[10px] text-rose-500 mt-1">{errors.authors.message}</p>}
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Categories (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sci-Fi, Computers, Programming"
                    {...register('categories', { required: 'Categories list is required' })}
                    className="form-input"
                  />
                  {errors.categories && <p className="text-[10px] text-rose-500 mt-1">{errors.categories.message}</p>}
                </div>

                {/* Total Copies */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Total Copies in Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register('totalCopies', { required: 'Copies count is required', min: { value: 0, message: 'Must be 0 or more' } })}
                    className="form-input"
                  />
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Book Cover Image
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="btn-secondary py-2 px-3 text-xs rounded-xl border border-slate-205 cursor-pointer hover:bg-slate-100 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      Upload Cover
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {coverPreview && (
                      <div className="w-10 h-14 border rounded overflow-hidden">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* E-Book Option */}
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isEbook"
                    {...register('isEbook')}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <label htmlFor="isEbook" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    This is a Digital E-Book (PDF)
                  </label>
                </div>

                {/* Audiobook Option */}
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isAudiobook"
                    {...register('isAudiobook')}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <label htmlFor="isAudiobook" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    This is an Audiobook (Mp3)
                  </label>
                </div>

                {/* PDF File Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    E-Book PDF Document
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="btn-secondary py-2 px-3 text-xs rounded-xl border border-slate-205 cursor-pointer hover:bg-slate-100 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      Upload PDF
                      <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
                    </label>
                    {pdfName && <span className="text-[10px] text-slate-450 truncate max-w-[150px]">{pdfName}</span>}
                  </div>
                </div>

                {/* Audio File Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Audiobook Audio File (Mp3)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="btn-secondary py-2 px-3 text-xs rounded-xl border border-slate-205 cursor-pointer hover:bg-slate-100 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      Upload Mp3
                      <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
                    </label>
                    {audioName && <span className="text-[10px] text-slate-450 truncate max-w-[150px]">{audioName}</span>}
                  </div>
                </div>

                {/* Smart Book Condition */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Book Health Condition
                  </label>
                  <select {...register('condition')} className="form-input text-xs">
                    <option value="New">New / Mint</option>
                    <option value="Good">Good / Used</option>
                    <option value="Fair">Fair / Worn</option>
                    <option value="Damaged">Damaged / Restrict</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Reading Difficulty
                  </label>
                  <select {...register('difficulty')} className="form-input text-xs">
                    <option value="Easy">Easy / Beginner</option>
                    <option value="Medium">Medium / Intermediate</option>
                    <option value="Hard">Hard / Advanced</option>
                  </select>
                </div>

                {/* Estimated Reading Time */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Est. Reading Time (Mins)
                  </label>
                  <input type="number" {...register('estimatedReadingTimeMinutes')} className="form-input" />
                </div>

                {/* Programming Level */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Coding Difficulty Level
                  </label>
                  <select {...register('programmingLevel')} className="form-input text-xs">
                    <option value="None">None</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                {/* Mathematics Level */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Math Level Required
                  </label>
                  <select {...register('mathematicsLevel')} className="form-input text-xs">
                    <option value="None">None</option>
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                {/* Career Relevance */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Career Relevance/Target Role
                  </label>
                  <input type="text" placeholder="e.g. MERN Developer, Data Scientist" {...register('careerRelevance')} className="form-input" />
                </div>

                {/* Required Knowledge */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Prerequisites/Required Knowledge (Comma-separated)
                  </label>
                  <input type="text" placeholder="e.g. OOP, Basic Math, Java Basics" {...register('requiredKnowledge')} className="form-input" />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Book Description
                  </label>
                  <textarea
                    rows={4}
                    {...register('description', { required: 'Description is required' })}
                    className="form-input resize-none py-3"
                  />
                  {errors.description && <p className="text-[10px] text-rose-500 mt-1">{errors.description.message}</p>}
                </div>
              </div>

              {!editBookId && (
                <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-2xl text-[11px] text-slate-500 leading-normal flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>AI Insight: Adding this book will automatically trigger a background Gemini request to generate a concise summary and 4 key learning takeaways for your students.</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-5 py-2.5 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2.5 text-xs rounded-xl shadow-md"
                >
                  {editBookId ? 'Save Changes' : 'Create Catalog Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== QUICK ADD CATEGORY MODAL ==================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/65 backdrop-blur-xs" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="glass-card w-full max-w-sm p-6 rounded-3xl shadow-2xl z-10 page-slide-up">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">Add New Genre/Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Cybersecurity, History"
                className="form-input text-xs"
                required
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary py-2 px-3 text-xs">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-3 text-xs">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
