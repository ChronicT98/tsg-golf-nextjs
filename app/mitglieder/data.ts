// app/mitglieder/data.ts
export interface MemberDetails {
    name: string;
    hcp: string;
    spitzname?: string;
    geboren?: string;
    firma?: string;
    beruf?: string;
    handy?: string;
    email?: string;
    web?: string;
    imageSrc: string;
    verstorben?: string;
  }
  
  export const gruendungsmitglieder: MemberDetails[] = [
    {
      name: "Peter Konrad",
      hcp: "-25,2",
      spitzname: "Wadolino",
      geboren: "08.10.1962",
      firma: "GP Planungs- und VertriebsGmbH",
      handy: "0676 3288882",
      email: "peterkonrad@aon.at",
      web: "www.brandl-rhz.com",
      imageSrc: "/images/Wadi_2020.jpg"
    },
    {
      name: "Christian Kafka",
      hcp: "-11,8",
      spitzname: "Präsi",
      geboren: "17.07.1968",
      firma: "GF 4k Projektmanagement GmbH",
      handy: "0664 4625714",
      email: "christian.kafka@4kp.at",
      web: "www.4kp.at",
      imageSrc: "/images/Christian.jpg"
    },
    {
      name: "Fritz Guggenberger",
      hcp: "-20,1",
      spitzname: "Fritzi",
      geboren: "01.04.1965",
      firma: "Prok. Mozart Destillerie",
      handy: "0664 5225236",
      email: "guggenberger@mozart-mail.com",
      web: "www.mozart-destillerie.com",
      imageSrc: "/images/fritz_neu.jpg"
    },
    {
      name: "Gerd Kafka",
      hcp: "-19,3",
      spitzname: "Gerti",
      geboren: "25.08.1961",
      firma: "GF Inter Fahnen GmbH",
      handy: "0664 3081763",
      email: "gerd@interfahnen.com",
      web: "www.interfahnen.com",
      imageSrc: "/images/Gerd.jpg"
    }
  ];
  
  export const ordentlicheMitglieder: MemberDetails[] = [
    {
      name: "Manfred Kühleitner",
      hcp: "-12,2",
      spitzname: "Fonti",
      geboren: "09.07.1963",
      beruf: "Friseur Kühleitner",
      handy: "0664 2603437",
      email: "manfred.kuehleitner@sbg.at",
      imageSrc: "/images/Manfred.jpg"
    },
    {
      name: "Adolf Geier",
      hcp: "-24,6",
      spitzname: "Adi",
      geboren: "19.08.1961",
      beruf: "Hotelmanager",
      handy: "0664 4563473",
      email: "info@hoteldreikreuz.at",
      web: "www.hoteldreikreuz.at",
      imageSrc: "/images/Adi.jpg"
    },
    {
      name: "Reinhold Gschnitzer",
      hcp: "-9,8",
      spitzname: "Gschni",
      geboren: "03.05.1951",
      beruf: "Computerfachmann",
      handy: "0664 2311911",
      email: "rg@rgi.at",
      web: "www.rgi.at",
      imageSrc: "/images/Gschni.jpg"
    },
    {
      name: "Ernst Aigner",
      hcp: "-16,9",
      spitzname: "Ernsti",
      geboren: "21.08.1973",
      firma: "GF Faimolz Manufaktur GmbH",
      handy: "0664 3574971",
      email: "ernst.aigner@faimolz.at",
      web: "www.faimolz.at",
      imageSrc: "/images/ernstl.jpg"
    },
    {
      name: "Gerhard Geosits",
      hcp: "-13,2",
      spitzname: "Galli",
      geboren: "10.02.1949",
      beruf: "Pensionist",
      handy: "0664 8147337",
      email: "Lieselotte.geosits@gmx.at",
      imageSrc: "/images/gerhard2.jpg"
    },
    {
      name: "Hans Peter Walter",
      hcp: "-23,9",
      spitzname: "Hape",
      geboren: "19.06.1962",
      firma: "GF - Walter GmbH",
      handy: "0676 5129601",
      email: "hp.walter@sales-service.net",
      web: "www.sales-service.net",
      imageSrc: "/images/HPW.jpg"
    },
    {
      name: "Bernhard Anderle",
      hcp: "-16,4",
      spitzname: "Berni",
      geboren: "07.07.1972",
      beruf: "Privatier",
      handy: "0664 4421000",
      email: "bernhard.anderle@sbg.at",
      imageSrc: "/images/Berni.jpg"
    },
    {
      name: "Leopold Bernhard",
      hcp: "-24,5",
      spitzname: "Leo",
      geboren: "02.02.1971",
      beruf: "Tattoo Artist",
      handy: "0664 3016105",
      email: "leo@nakedtrust.com",
      imageSrc: "/images/Leo2.jpg"
    },
    {
      name: "Christian Meinhart",
      hcp: "-20,0",
      geboren: "29.02.1964",
      beruf: "Teamleiter bei Porsche Austria",
      handy: "0664 3451677",
      email: "christian.meinhart@porsche.co.at",
      imageSrc: "/images/meinhart.jpg"
    }
  ];
  
  export const inMemoriam: MemberDetails[] = [
    {
      name: "Peter Kainz",
      hcp: "-12,1",
      spitzname: "Pepo",
      geboren: "04.10.1964",
      verstorben: "04.04.2016",
      imageSrc: "/images/Peter_trauerflor.jpg"
    },
    {
      name: "Christian Reinhard",
      hcp: "-23,7",
      spitzname: "Chrischi",
      geboren: "20.09.1964",
      verstorben: "05.08.2019",
      imageSrc: "/images/Chrischi_Trauerflor.jpg"
    }
  ];