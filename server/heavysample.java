public class EnterpriseGarbageCollector {

    /**
     * SMELL: Too Many Parameters (8 Stück!)
     * COMPLEXITY: Extrem hoch durch 4-fache Verschachtelung
     */
    public void processEnterpriseData(int id, String tenant, boolean priority, double budget, int retryCount, String region, Object metadata, long timestamp) {
        if (priority) {
            for (int i = 0; i < retryCount; i++) {
                if (budget > 1000.50) {
                    while (id < 5000) {
                        if (region.equals("EU")) {
                            System.out.println("Processing EU...");
                            id += 100;
                        } else if (region.equals("US")) {
                            id += 50;
                        } else {
                            id += 10;
                        }

                        // Ternary Smells
                        String status = (id > 2000) ? (priority ? "URGENT" : "NORMAL") : "PENDING";
                    }
                } else {
                    System.out.println("Budget too low");
                }
            }
        } else {
            try {
                if (tenant != null) {
                    switch (tenant) {
                        case "ALPHA": System.out.println("A"); break;
                        case "BETA": System.out.println("B"); break;
                        case "GAMMA": System.out.println("G"); break;
                        default: System.out.println("Unknown");
                    }
                }
            } catch (Exception e) {
                if (e instanceof NullPointerException) {
                    System.err.println("NPE");
                }
            }
        }
    }

    /**
     * SMELL: Long Method (> 30 Zeilen)
     * Diese Methode tut fast nichts, ist aber extrem lang aufgebläht.
     */
    public void massiveFormattingMethod() {
        System.out.println("Initializing...");
        String line = "------------------------------------";
        System.out.println(line);
        System.out.println("Step 1: Check");
        System.out.println("Step 2: Verify");
        System.out.println("Step 3: Authenticate");
        System.out.println("Step 4: Authorize");
        System.out.println("Step 5: Prepare");
        System.out.println("Step 6: Execute");
        System.out.println("Step 7: Log");
        System.out.println("Step 8: Cleanup");
        System.out.println("Step 9: Notify");
        System.out.println("Step 10: Finish");
        System.out.println(line);

        // Künstliche Verlängerung
        int x = 0;
        x++; x++; x++; x++; x++; x++; x++; x++; x++; x++;
        x++; x++; x++; x++; x++; x++; x++; x++; x++; x++;

        if (x > 15) {
            System.out.println("Method is officially too long now.");
        }
    }

    public static void main(String[] args) {
        EnterpriseGarbageCollector egc = new EnterpriseGarbageCollector();
        egc.processEnterpriseData(1, "ALPHA", true, 5000.0, 3, "EU", null, 0L);
    }
}