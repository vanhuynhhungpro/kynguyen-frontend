
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  code: string;
  status: 'Bản nháp' | 'Đang nghiên cứu' | 'Đang thử nghiệm' | 'Chờ duyệt' | 'Đã duyệt';
  progress: number;
  ingredients: any[];
  creator: string;
  ownerId: string;
  createdDate: string;
  createdAt?: any; // Firestore timestamp
}

const MyProjects: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Status list from user request
  const statusFilters = ['Tất cả', 'Bản nháp', 'Đang nghiên cứu', 'Đang thử nghiệm', 'Chờ duyệt', 'Đã duyệt'];

  useEffect(() => {
    if (!currentUser) return;

    // Lắng nghe dữ liệu từ Firestore cho các dự án của user hiện tại
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => ['Đang nghiên cứu', 'Đang thử nghiệm'].includes(p.status)).length;
    const pending = projects.filter(p => p.status === 'Chờ duyệt').length;
    const approved = projects.filter(p => p.status === 'Đã duyệt').length;

    return [
      { label: 'TỔNG DỰ ÁN', value: total.toString(), icon: 'folder', color: 'text-primary', bg: 'bg-slate-100', trend: 'Dữ liệu thời gian thực', trendColor: 'text-slate-400' },
      { label: 'ĐANG HOẠT ĐỘNG', value: active.toString(), icon: 'science', color: 'text-blue-500', bg: 'bg-blue-50', trend: 'Nghiên cứu & Thử nghiệm', trendColor: 'text-blue-600' },
      { label: 'CHỜ PHÊ DUYỆT', value: pending.toString(), icon: 'hourglass_empty', color: 'text-orange-500', bg: 'bg-orange-50', trend: 'Cần xem xét', trendColor: 'text-orange-600' },
      { label: 'ĐÃ HOÀN THÀNH', value: approved.toString(), icon: 'verified', color: 'text-emerald-500', bg: 'bg-emerald-50', trend: 'Đã duyệt', trendColor: 'text-emerald-600' },
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchesFilter = activeFilter === 'Tất cả' || project.status === activeFilter;
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             project.code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
  }, [activeFilter, searchQuery, projects]);

  const getStatusStyle = (status: Project['status']) => {
    switch (status) {
      case 'Bản nháp': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'Đang nghiên cứu': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'Đang thử nghiệm': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Chờ duyệt': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Đã duyệt': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const handleOpenProject = (id: string) => {
    // Điều hướng tới trang chi tiết dự án (hiện tại có thể dùng CreateProject làm trang edit)
    navigate(`/create-project?id=${id}`);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary tracking-tight font-display">Dự án của tôi</h2>
          <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi tiến độ các công thức R&D từ Database</p>
        </div>
        <Link to="/create-project" className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 shrink-0">
          <span className="material-symbols-outlined text-xl filled-icon">add_circle</span>
          Tạo dự án mới
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col gap-2 hover:border-primary/20 transition-all cursor-default group">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
              <span className={`material-symbols-outlined ${stat.color} ${stat.bg} p-2 rounded-xl text-[22px] transition-transform group-hover:scale-110`}>{stat.icon}</span>
            </div>
            <p className="text-4xl font-bold text-slate-900 font-display">{stat.value}</p>
            <p className={`text-[11px] font-bold ${stat.trendColor} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-[16px]">info</span> 
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Controls: Search and Filters Area */}
      <div className="space-y-6 pt-4">
        {/* Search Bar Row */}
        <div className="w-full max-w-2xl">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              placeholder="Tìm kiếm theo tên dự án hoặc mã số..."
            />
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`h-9 px-5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          <button className="h-10 px-6 flex items-center gap-2 rounded-full border border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold shrink-0">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Lọc nâng cao
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
          <p className="text-slate-500 mt-4 font-medium">Đang tải danh sách dự án...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => handleOpenProject(project.id)}
              className="bg-white rounded-3xl p-7 shadow-card border border-slate-100 hover:shadow-soft transition-all group cursor-pointer flex flex-col gap-6 relative"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-slate-900 font-bold text-xl group-hover:text-primary transition-colors truncate font-display">
                    {project.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Mã: {project.code}</p>
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-lg border shrink-0 uppercase tracking-widest ${getStatusStyle(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>TIẾN ĐỘ</span>
                  <span className="text-slate-900">{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[64px]">
                {project.ingredients?.map((ing: any, i: number) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-tighter bg-slate-50 border-slate-100 text-slate-400"
                  >
                    {ing.name}
                  </span>
                ))}
              </div>

              <div className="pt-6 mt-auto border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                    {project.creator?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Ngày tạo: {project.createdDate}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenProject(project.id); }}
                    className="size-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-[22px]">visibility</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/create-project?id=${project.id}&edit=true`); }}
                    className="size-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
            <span className="material-symbols-outlined text-5xl">folder_off</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">Chưa có dự án nào</h3>
          <p className="text-slate-500 mt-2 max-w-sm font-medium">Bạn chưa tạo dự án nghiên cứu nào. Bắt đầu ngay bằng cách nhấn nút "Tạo dự án mới".</p>
          <Link 
            to="/create-project"
            className="mt-8 text-primary font-bold hover:underline flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span> Tạo dự án đầu tiên
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
