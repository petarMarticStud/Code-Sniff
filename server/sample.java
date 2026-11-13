public class AnalysisTest {

    public void checkValue(int value) {
        // Diese Methode hat eine Komplexität, die dein Parser erkennen kann
        if (value > 10) {
            System.out.println("Wert ist hoch");
        } else {
            System.out.println("Wert ist niedrig");
        }
    }

    public static void main(String[] args) {
        AnalysisTest test = new AnalysisTest();
        test.checkValue(15);
    }
}