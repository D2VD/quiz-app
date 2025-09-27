import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/context/AuthContext';
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage';

type TypingOptions = {
  typingSpeed?: number;
  deleteSpeed?: number;
  pause?: number;
  loop?: boolean;
};

const useTypingEffect = (text: string, options: TypingOptions = {}) => {
  const { typingSpeed = 70, deleteSpeed = 40, pause = 1600, loop = true } = options;
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = text;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (!isDeleting && displayed.length < fullText.length) {
      timeout = setTimeout(() => {
        setDisplayed(fullText.slice(0, displayed.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayed.length === fullText.length) {
      timeout = setTimeout(() => {
        if (loop) {
          setIsDeleting(true);
        }
      }, pause);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(fullText.slice(0, displayed.length - 1));
      }, deleteSpeed);
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [deleteSpeed, displayed, isDeleting, loop, pause, text, typingSpeed]);

  return displayed;
};

type TypedTextProps = TypingOptions & {
  text: string;
  className?: string;
};

const TypedText = ({ text, className, ...options }: TypedTextProps) => {
  const typed = useTypingEffect(text, options);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  useLayoutEffect(() => {
    if (measureRef.current) {
      setContainerWidth(measureRef.current.offsetWidth);
    }
  }, [text]);

  useEffect(() => {
    if (!measureRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(measureRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <span
      className={`relative inline-flex items-center ${className ?? ''}`}
      style={containerWidth ? { minWidth: `${containerWidth}px` } : undefined}
    >
      <span>{typed}</span>
      <span
        aria-hidden="true"
        className="ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-current align-middle"
      />
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 whitespace-pre opacity-0"
      >
        {text}
      </span>
    </span>
  );
};

export const HomePage: React.FC = () => {
  const { session, profile } = useAuth();

  if (session && profile?.role === 'student') {
    return <StudentDashboardPage />;
  }

  if (session && profile?.role === 'teacher') {
    return (
      <div className="space-y-10">
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500 to-purple-500 p-10 text-white">
          <h1 className="text-3xl font-semibold">Xin chào {profile.fullName}!</h1>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100">
            Quản lý lớp học, tạo đề thi và theo dõi tiến độ học sinh trong một giao diện thống nhất.
          </p>
          <Link
            to="/teacher"
            className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100"
          >
            Đi tới bảng điều khiển giáo viên
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    {
      title: 'Phòng chờ trực quan',
      description: 'Tạo phòng chờ đếm ngược tự động mở đề khi đến giờ, đồng bộ cho toàn bộ lớp học.'
    },
    {
      title: 'Quản lý lớp học thông minh',
      description: 'Theo dõi tiến độ từng học sinh, gửi nhắc nhở và thống kê kết quả ngay trên một bảng điều khiển duy nhất.'
    },
    {
      title: 'Đề thi linh hoạt',
      description: 'Kết hợp câu hỏi trắc nghiệm và tự luận, hỗ trợ ngân hàng câu hỏi để tái sử dụng nhanh chóng.'
    }
  ];

  const steps = [
    {
      title: 'Tạo lớp & đề thi',
      description: 'Thêm lớp học, nhập danh sách học sinh hoặc chia sẻ mã tham gia để mời ngay lập tức.'
    },
    {
      title: 'Thiết lập phòng chờ',
      description: 'Đặt thời gian bắt đầu, giới hạn thời lượng và gửi thông báo cho học sinh cùng phụ huynh.'
    },
    {
      title: 'Theo dõi & chấm điểm',
      description: 'Chấm tự động phần trắc nghiệm, ghi chú phần tự luận và xuất báo cáo chi tiết chỉ với vài cú nhấp chuột.'
    }
  ];

  const heroHeading =
    'Phòng thi trực tuyến sắc nét, truyền cảm hứng sáng tạo';
  const heroDescription =
    'Tạo không gian thi hiện đại với phòng chờ đếm ngược, đề linh hoạt và báo cáo thời gian thực. QuizLab giúp giáo viên tổ chức kỳ thi hiệu quả trong khi học sinh tập trung vào trải nghiệm làm bài tối giản.';

  return (
    <div className="mx-auto max-w-6xl space-y-24">
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-indigo-700 via-purple-600 to-sky-500 px-6 py-20 text-left text-slate-100 shadow-2xl sm:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-32 h-80 w-80 rounded-full bg-white/20 blur-3xl animate-blob" />
          <div
            className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-blob"
            style={{ animationDelay: '-6s' }}
          />
          <div
            className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-blob-slow"
            style={{ animationDelay: '-3s' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)]" />
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
            QuizLab
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              <TypedText text={heroHeading} />
            </h1>
            <p className="text-lg text-white/90">
              <TypedText text={heroDescription} typingSpeed={45} deleteSpeed={30} pause={2200} />
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Bắt đầu miễn phí
            </Link>
            <a
              href="#features"
              className="rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Xem tính năng
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6 text-left">
          <h2 className="text-3xl font-semibold text-slate-900">Tạo kỳ thi chuyên nghiệp chỉ trong vài phút</h2>
          <p className="text-lg text-slate-600">
            QuizLab được thiết kế riêng cho giáo viên với quy trình mạch lạc: từ tạo đề thi đến công bố kết quả. Giao diện rõ ràng giúp bạn tập trung vào nội dung, không phải thao tác phức tạp.
          </p>
          <div className="grid gap-4">
            {highlights.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative isolate overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-10 text-left shadow-lg">
          <div className="absolute -top-10 right-[-60px] h-48 w-48 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="absolute bottom-[-40px] left-[-40px] h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="relative space-y-6">
            <span className="inline-flex rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
              Quy trình rõ ràng
            </span>
            <ol className="space-y-4 text-sm text-slate-600">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/10 text-base font-semibold text-indigo-600">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-slate-900">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-10 text-left shadow-sm md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-slate-900">Học sinh tập trung tuyệt đối</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            Trang làm bài được thiết kế tối giản với ánh sáng dịu, chỉ hiển thị những thông tin cần thiết như đồng hồ đếm ngược và câu hỏi. Hiệu ứng tinh giản giúp học sinh giảm áp lực và tránh bị xao nhãng bởi chuyển động thừa.
          </p>
        </div>
        <div className="grid gap-4 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h4 className="text-base font-semibold text-slate-900">Đồng hồ rõ ràng</h4>
            <p className="mt-2">Màn hình đồng hồ lớn với font chữ dễ nhìn, đổi màu nhẹ khi gần hết thời gian để học sinh chủ động hơn.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <h4 className="text-base font-semibold text-slate-900">Giao diện nhẹ nhàng</h4>
            <p className="mt-2">Tông màu trung tính và khoảng cách hợp lý giữa các phần tử giúp mắt không mỏi và tăng tốc độ làm bài.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
