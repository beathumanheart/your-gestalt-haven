import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, XCircle } from "lucide-react";

const BookingCancelled = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const success = searchParams.get("success") !== "false";

  const content = language === "ru"
    ? {
        cancelledTitle: "Запись отменена",
        cancelledText: "Ваша запись была успешно отменена.",
        errorTitle: "Ошибка отмены",
        errorText: "Не удалось отменить запись. Возможно, она уже была отменена.",
        bookAnother: "Записаться на новую сессию",
        backHome: "На главную",
      }
    : {
        cancelledTitle: "Booking Cancelled",
        cancelledText: "Your booking has been successfully cancelled.",
        errorTitle: "Cancellation Error",
        errorText: "Could not cancel the booking. It may have already been cancelled.",
        bookAnother: "Book Another Session",
        backHome: "Back to Home",
      };

  const handleBookAnother = () => {
    navigate(`/${language}/#contact`);
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {success ? (
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
        ) : (
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
        )}

        <h1 className="font-display text-3xl font-light text-foreground">
          {success ? content.cancelledTitle : content.errorTitle}
        </h1>
        <p className="font-body text-muted-foreground">
          {success ? content.cancelledText : content.errorText}
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <button onClick={handleBookAnother} className="btn-primary py-3 text-sm">
            {content.bookAnother}
          </button>
          <button
            onClick={() => navigate(`/${language}/`)}
            className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            {content.backHome}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingCancelled;
