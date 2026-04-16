export default function CallNextButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-red-600 text-white text-3xl py-10 px-20 rounded-2xl"
    >
      Llamar Siguiente
    </button>
  );
}