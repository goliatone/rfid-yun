/**
 * Useful binary lookup:
 * http://www.binary-code.org/binary
 *
 *
 *
 * Wiegand HID 26 bit card reader.
 * Format:
 * Parity |<-Facility Code->| <---------------  Card Code  -------------->
 *    0 1 | 2 3 4 5 6 7 8 9 | 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
 *
 * More here: http://www.pagemac.com/azure/data_formats.php
 */
#include <Process.h>
#include <Bridge.h>
// #include <HttpClient.h>

#define MAX_BITS 100
#define WEIGAND_WAIT_TIME  3000

/*
 * data bit store
 */
unsigned char databits[MAX_BITS];
/*
 * bits captured
 */
unsigned char bitCount;
/*
 * goes low when data is currently being captured
 */
unsigned char flagDone;
/*
 * countdown until we assume there are no more bits
 */
unsigned int weigand_counter;
/*
 * decoded facility code
 */
unsigned long facilityCode = 0;
/*
 * decoded card code
 */
unsigned long cardCode = 0;

String binaryString = "";


String RESOLVE_IP = "avahi-resolve -n ";
String LOCAL_NAME = "sensuino.local";
/*
 * It has to be an IP, at least
 * "goliatodromo.local" did not work :/
 */
String HOST = "192.168.1.145";
String PORT = "3030";
String CMD = "/usr/bin/curl -k -H \"Content-Type: application/json\" -X POST http://" + HOST + ":"+ PORT + "/rfid -d";
/*
 * interrupt that happens when
 * INTO goes low (0 bit)
 */
void ISR_INT0()
{
    bitCount++;
    flagDone = 0;
    weigand_counter = WEIGAND_WAIT_TIME;

}

/*
 * interrupt that happens when
 * INT1 goes low (1 bit)
 */
void ISR_INT1()
{
    databits[bitCount] = 1;
    bitCount++;
    flagDone = 0;
    weigand_counter = WEIGAND_WAIT_TIME;
}

void setup()
{
    pinMode(13, OUTPUT);   // LED
    pinMode(2, INPUT);     // DATA0 (INT0)
    pinMode(3, INPUT);     // DATA1 (INT1)

    Serial.begin(115200);
    Bridge.begin();

    while (!Serial);
    Serial.println("RFID Readers");

    HOST = getIP(LOCAL_NAME);

    Serial.println("---");
    Serial.println("Setting ip to " + HOST);

    // binds the ISR functions to the falling edge of INTO and INT1
    // Had to invert the values here, as the code
    // was not reading the right codes.
    attachInterrupt(1, ISR_INT0, RISING);
    attachInterrupt(0, ISR_INT1, RISING);


    weigand_counter = WEIGAND_WAIT_TIME;
}

String getIP(String localName)
{
    Serial.println("FINDING IP");
    Process p;
    p.runShellCommand(RESOLVE_IP + localName);
    p.run();
    String buf = "";
    while(p.available() > 0)
    {
        char c = p.read();
        buf += c;
    }

    Serial.flush();

    buf.replace("sensuino.local", "");
    buf.trim();
    Serial.println(buf);
    return buf;
}


void loop()
{
    // This waits to make sure that there have been no more data pulses before processing data
    if (!flagDone)
    {
        if (--weigand_counter == 0)
        {
            flagDone = 1;
        }
    }

    // if we have bits and we the weigand counter went out
    if (bitCount > 0 && flagDone)
    {
        unsigned char i;

        Serial.print("Read ");
        Serial.print(bitCount);
        Serial.print(" bits. ");

        Serial.println("");
        Serial.print("BIN ");
        binaryString = "";
        for (i=0; i<25; i++)
        {
            binaryString += String(databits[i]);
        }
        Serial.print(binaryString);


        /*
         * We could add support for other card
         * formats, but right now 26 is what
         * we use.
         */
        if (bitCount == 26)
        {
            Serial.println("");
            Serial.print("FC: ");
            // standard 26 bit format
            // 2 parity bits. 8 facility code
            for (i=2; i<10; i++)
            {
                facilityCode <<=1;
                facilityCode |= databits[i];
                Serial.print(databits[i]);
            }
        Serial.println("");
        Serial.print("CC: ");
        // card code = bits 10 to 25
        for (i=10; i<25; i++)
        {
            cardCode <<=1;
            cardCode |= databits[i];
            Serial.print(databits[i]);
        }

        printBits();
    } else {
        // you can add other formats if you want!
        Serial.println("Unable to decode.");
    }
        // cleanup and get ready for the next card
        bitCount = 0; facilityCode = 0; cardCode = 0;
        for (i=0; i<26; i++)
        {
            databits[i] = 0;
        }
    }
}

void printBits()
{
    Serial.println("");
    Serial.print("FC = ");
    Serial.print(facilityCode);
    Serial.print(", CC = ");
    Serial.println(cardCode);
    Serial.println("");

    String json = "";
    json += " '{ \"cc\" : " + String(cardCode) + ", ";
    json += "\"bn\" : \"" + binaryString + "\", ";
    json += "\"fc\" : "+String(facilityCode)+"}'";

    Process p;
    p.runShellCommand(CMD + json);
    while(p.running());
    p.close();
    Serial.println("Payload sent!");
    Serial.println(CMD + json);
}
